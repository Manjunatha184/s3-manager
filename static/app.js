let currentBucket = null;
let currentPrefix = '';
let selectedItems = new Map();

function checkAWSStatus() {
    fetch('/status')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'configured') {
                console.log('AWS configured:', data);
            } else {
                let msg = 'AWS not configured properly.';
                if (data.error) msg += ' Error: ' + data.error;
                if (data.region) msg += ' Region: ' + data.region;
                if (data.access_key) msg += ' Access Key: ' + data.access_key;
                showMessage(msg, false);
                console.log('AWS status:', data);
            }
        })
        .catch(err => {
            showMessage('Unable to check AWS status: ' + err.message, false);
            console.error('Status check error:', err);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    checkAWSStatus();
    loadBuckets();
    
    // Event listeners
    document.getElementById('newFolderBtn').addEventListener('click', showNewFolderModal);
    document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', uploadFiles);
    document.getElementById('newBucketBtn').addEventListener('click', showNewBucketModal);
    document.getElementById('deleteBucketBtn').addEventListener('click', showDeleteBucketModal);
    
    // Context menu
    document.addEventListener('contextmenu', showContextMenu);
    document.addEventListener('click', hideContextMenu);
    
    // Prevent right-click on sidebar buckets
    document.getElementById('bucketList').addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Context menu items
    document.getElementById('copyItem').addEventListener('click', copySelected);
    document.getElementById('moveItem').addEventListener('click', moveSelected);
    document.getElementById('deleteItem').addEventListener('click', deleteSelected);
    
    // Modal
    document.querySelector('.close').addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) {
            hideModal();
        }
    });
});

function loadBuckets() {
    fetch('/buckets')
        .then(res => res.json())
        .then(data => {
            const ul = document.getElementById('bucketList');
            ul.innerHTML = '';
            if (data.error) {
                showMessage(data.error, false);
                return;
            }
            data.forEach(bucket => {
                const li = document.createElement('li');
                li.textContent = bucket;
                li.addEventListener('click', () => selectBucket(bucket));
                ul.appendChild(li);
            });
        })
        .catch(err => showMessage('Failed to load buckets', false));
}

function selectBucket(bucket) {
    currentBucket = bucket;
    currentPrefix = '';
    loadContents();
}

function loadContents() {
    if (!currentBucket) return;
    
    fetch(`/objects?bucket=${currentBucket}&prefix=${currentPrefix}`)
        .then(res => res.json())
        .then(data => {
            updateBreadcrumb();
            updateFileList(data.folders || [], data.files || []);
        })
        .catch(err => showMessage('Failed to load contents', false));
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';
    
    const rootSpan = document.createElement('span');
    rootSpan.textContent = currentBucket;
    rootSpan.addEventListener('click', () => navigateTo(''));
    breadcrumb.appendChild(rootSpan);
    
    if (currentPrefix) {
        const parts = currentPrefix.split('/').filter(p => p);
        let path = '';
        parts.forEach((part, index) => {
            path += part + '/';
            const span = document.createElement('span');
            span.textContent = part;
            span.addEventListener('click', () => navigateTo(path));
            breadcrumb.appendChild(span);
        });
    }
}

function navigateTo(prefix) {
    currentPrefix = prefix;
    loadContents();
}

function updateFileList(folders, files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    // Parent directory
    if (currentPrefix) {
        const parentItem = createFileItem('..', 'folder', '', true);
        parentItem.addEventListener('dblclick', () => {
            const parts = currentPrefix.split('/').filter(p => p);
            parts.pop();
            navigateTo(parts.join('/') + (parts.length ? '/' : ''));
        });
        fileList.appendChild(parentItem);
    }
    
    // Folders
    folders.forEach(folder => {
        const name = folder.replace(currentPrefix, '').replace('/', '');
        const item = createFileItem(name, 'folder');
        item.addEventListener('dblclick', () => navigateTo(folder));
        item.addEventListener('click', () => selectItem(item, folder, 'folder'));
        fileList.appendChild(item);
    });
    
    // Files
    files.forEach(file => {
        const name = file.replace(currentPrefix, '');
        const item = createFileItem(name, 'file');
        item.addEventListener('click', () => selectItem(item, file, 'file'));
        fileList.appendChild(item);
    });
}

function createFileItem(name, type, size = '', isParent = false) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = type === 'folder' ? (isParent ? '⬆️' : '📁') : '📄';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = name;
    
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'size';
    sizeDiv.textContent = size;
    
    item.appendChild(icon);
    item.appendChild(nameDiv);
    item.appendChild(sizeDiv);
    
    return item;
}

function selectItem(item, path, type) {
    if (event.ctrlKey) {
        item.classList.toggle('selected');
        if (item.classList.contains('selected')) {
            selectedItems.set(path, {path, type});
        } else {
            selectedItems.delete(path);
        }
    } else {
        document.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
        selectedItems.clear();
        item.classList.add('selected');
        selectedItems.set(path, {path, type});
    }
}

function showContextMenu(e) {
    e.preventDefault();
    // Don't show context menu for sidebar elements
    if (e.target.closest('.sidebar')) {
        return;
    }
    
    if (selectedItems.size === 0) return;
    
    const menu = document.getElementById('contextMenu');
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.style.display = 'block';
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

function copySelected() {
    if (selectedItems.size === 0) return;
    showCopyMoveModal('copy');
    hideContextMenu();
}

function moveSelected() {
    if (selectedItems.size === 0) return;
    showCopyMoveModal('move');
    hideContextMenu();
}

function showCopyMoveModal(action) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = action === 'copy' ? 'Copy Items' : 'Move Items';
    body.innerHTML = `
        <p>Destination Bucket:</p>
        <input type="text" id="destBucketInput" placeholder="Bucket name" value="${currentBucket}">
        <p>Destination Path:</p>
        <input type="text" id="destPathInput" placeholder="Path (leave empty for root)" value="${currentPrefix}">
        <button onclick="${action}Items()">${action.charAt(0).toUpperCase() + action.slice(1)}</button>
    `;
    modal.style.display = 'block';
}

function copyItems() {
    const destBucket = document.getElementById('destBucketInput').value;
    const destPath = document.getElementById('destPathInput').value;
    
    selectedItems.forEach(item => {
        const destKey = destPath + item.path.replace(currentPrefix, '');
        fetch('/copy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                src_bucket: currentBucket,
                src_key: item.path,
                dest_bucket: destBucket,
                dest_key: destKey
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                showMessage(data.message, true);
            } else {
                showMessage(data.error || 'Copy failed', false);
            }
        });
    });
    hideModal();
    loadContents();
}

function moveItems() {
    const destBucket = document.getElementById('destBucketInput').value;
    const destPath = document.getElementById('destPathInput').value;
    
    selectedItems.forEach(item => {
        const destKey = destPath + item.path.replace(currentPrefix, '');
        fetch('/move', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                src_bucket: currentBucket,
                src_key: item.path,
                dest_bucket: destBucket,
                dest_key: destKey
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                showMessage(data.message, true);
            } else {
                showMessage(data.error || 'Move failed', false);
            }
        });
    });
    hideModal();
    loadContents();
}

function deleteSelected() {
    if (confirm('Are you sure you want to delete the selected items?')) {
        selectedItems.forEach(item => {
            if (item.type === 'file') {
                deleteFile(item.path);
            } else {
                deleteFolder(item.path);
            }
        });
    }
    hideContextMenu();
}

function deleteFile(key) {
    fetch('/file/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bucket: currentBucket, key: key})
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showMessage(data.message, true);
            loadContents();
        } else {
            showMessage(data.error || 'Delete failed', false);
        }
    });
}

function deleteFolder(folder) {
    fetch('/folder/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bucket: currentBucket, folder: folder})
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showMessage(data.message, true);
            loadContents();
        } else {
            showMessage(data.error || 'Delete failed', false);
        }
    });
}

function showNewFolderModal() {
    if (!currentBucket) {
        showMessage('Please select a bucket first', false);
        return;
    }
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = 'New Folder';
    body.innerHTML = `
        <input type="text" id="folderNameInput" placeholder="Folder name">
        <button onclick="createFolder()">Create</button>
    `;
    modal.style.display = 'block';
}

function showNewBucketModal() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = 'New Bucket';
    body.innerHTML = `
        <input type="text" id="bucketNameInput" placeholder="Bucket name">
        <button onclick="createBucket()">Create</button>
    `;
    modal.style.display = 'block';
}

function showDeleteBucketModal() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = 'Delete Bucket';
    body.innerHTML = `
        <p><strong>Warning:</strong> Deleting a bucket will permanently remove all its contents. This action cannot be undone.</p>
        <input type="text" id="deleteBucketNameInput" placeholder="Bucket name to delete">
        <button onclick="deleteBucket()">Delete</button>
    `;
    modal.style.display = 'block';
}

function createBucket() {
    const name = document.getElementById('bucketNameInput').value.trim();
    if (!name) {
        showMessage('Bucket name is required', false);
        hideModal();
        return;
    }
    
    // Specific validation checks
    if (/[A-Z]/.test(name)) {
        showMessage('Bucket name cannot contain uppercase letters. Please use only lowercase letters.', false);
        hideModal();
        return;
    }
    
    if (name.length < 3 || name.length > 63) {
        showMessage('Bucket name must be 3-63 characters long', false);
        hideModal();
        return;
    }
    
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
        showMessage('Bucket name can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.', false);
        hideModal();
        return;
    }
    
    fetch('/bucket/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bucket: name})
    })
    .then(res => {
        console.log('Response status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Create bucket response:', data);
        if (data.message) {
            showMessage(data.message, true);
            loadBuckets();
            hideModal();
        } else {
            // Check for specific AWS errors
            let errorMsg = data.error || 'Create failed';
            if (errorMsg.includes('not available')) {
                errorMsg = 'Bucket name already taken. Please choose a different name.';
            } else if (errorMsg.includes('InvalidBucketName')) {
                errorMsg = 'Invalid bucket name format. Use only lowercase letters, numbers, and hyphens.';
            }
            showMessage(errorMsg, false);
            hideModal();
        }
    })
    .catch(err => {
        console.error('Create bucket error:', err);
        showMessage('Network error occurred. Please check if the server is running.', false);
        hideModal();
    });
}

function deleteBucket() {
    const name = document.getElementById('deleteBucketNameInput').value.trim();
    if (!name) {
        showMessage('Bucket name is required', false);
        hideModal();
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the bucket "${name}"? This will permanently delete all contents.`)) {
        hideModal();
        return;
    }
    
    fetch('/bucket/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bucket: name})
    })
    .then(res => {
        console.log('Delete response status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Delete bucket response:', data);
        if (data.message) {
            showMessage(data.message, true);
            loadBuckets();
            // If the deleted bucket was selected, clear selection
            if (currentBucket === name) {
                currentBucket = null;
                currentPrefix = '';
                updateBreadcrumb();
                updateFileList([], []);
            }
            hideModal();
        } else {
            showMessage(data.error || 'Delete failed', false);
            hideModal();
        }
    })
    .catch(err => {
        console.error('Delete bucket error:', err);
        showMessage('Network error occurred', false);
        hideModal();
    });
}

function createFolder() {
    const name = document.getElementById('folderNameInput').value;
    if (!name) return;
    
    const folderPath = currentPrefix + name + '/';
    
    fetch('/folder/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bucket: currentBucket, folder: folderPath})
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showMessage(data.message, true);
            loadContents();
            hideModal();
        } else {
            showMessage(data.error || 'Create failed', false);
        }
    });
}

function uploadFiles() {
    if (!currentBucket) {
        showMessage('Please select a bucket first', false);
        return;
    }
    const files = document.getElementById('fileInput').files;
    Array.from(files).forEach(file => {
        const formData = new FormData();
        formData.append('bucket', currentBucket);
        formData.append('key', currentPrefix + file.name);
        formData.append('file', file);
        
        fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                showMessage(data.message, true);
                loadContents();
            } else {
                showMessage(data.error || 'Upload failed', false);
            }
        });
    });
}

function refreshCurrentView() {
    loadContents();
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

function showMessage(msg, success = true) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message ' + (success ? 'success' : 'error');
    messageEl.textContent = msg;
    messageEl.style.display = 'block';  // Make it visible
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}