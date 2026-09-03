// ============================================
// VI FEXPS - PANEL DE ADMINISTRACIÓN
// ============================================

let currentUser = null;
let currentFilter = 'todos';
let emprendedores = [];
let usuarios = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkSession();
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => { switchView(btn.dataset.view); });
    });
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
    document.getElementById('edit-user-form').addEventListener('submit', handleEditUser);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderEmprendedores();
        });
    });
}

async function checkSession() {
    const session = await getSupabaseSession();
    if (session && session.user) {
        let profile = null;
        try {
            const profiles = await _insforgeGet('usuarios', `id=eq.${session.user.id}&select=*`);
            if (profiles && profiles.length > 0) profile = profiles[0];
        } catch {}
        currentUser = profile || { id: session.user.id, email: session.user.email, nombre: session.user.email, rol: 'admin' };
        showAdminDashboard();
        updateUserInfo();
        await loadData();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Ingresando...';
    btn.disabled = true;
    errorDiv.style.display = 'none';
    
    try {
        const user = await authenticateUser(email, password);
        if (!user) throw new Error('Credenciales incorrectas');
        
        currentUser = { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
        showAdminDashboard();
        updateUserInfo();
        await loadData();
    } catch (err) {
        errorDiv.textContent = err.message || 'Credenciales incorrectas';
        errorDiv.style.display = 'block';
    } finally {
        btn.textContent = 'Iniciar Sesión';
        btn.disabled = false;
    }
}

function updateUserInfo() {
    document.getElementById('user-name').textContent = currentUser.nombre;
    document.getElementById('user-role').textContent = 'Administrador';
}

async function signOut() {
    await signOutAuth();
    currentUser = null;
    showRegistrationForm();
}

async function switchView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    if (viewName === 'dashboard') {
        await loadFormStatus();
        await updateDashboard();
    } else if (viewName === 'emprendedores') {
        emprendedores = await getEmprendedores();
        renderEmprendedores();
    } else if (viewName === 'usuarios') {
        usuarios = await getUsers();
        renderUsers();
    }
}

async function loadData() {
    emprendedores = await getEmprendedores();
    usuarios = await getUsers();
    await loadFormStatus();
    await updateDashboard();
    renderEmprendedores();
    renderUsers();
}

async function updateDashboard() {
    const stats = await getStats(emprendedores);
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pendientes').textContent = stats.pendientes;
    document.getElementById('stat-aprobados').textContent = stats.aprobados;
    document.getElementById('stat-rechazados').textContent = stats.rechazados;
    
    const recentEmprendedores = [...emprendedores].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const tbody = document.getElementById('dashboard-table-body');
    
    if (recentEmprendedores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No hay registros aún</td></tr>`;
        return;
    }
    
    tbody.innerHTML = recentEmprendedores.map(emp => `
        <tr>
            <td>${emp.nombres || '-'}</td>
            <td>${emp.nombre_emprendimiento || '-'}</td>
            <td>${emp.linea_negocio || '-'}</td>
            <td>${emp.redes_sociales || '-'}</td>
            <td>${renderStatusDropdown(emp)}</td>
        </tr>
    `).join('');
}

function renderEmprendedores() {
    let filteredData = emprendedores;
    if (currentFilter !== 'todos') filteredData = emprendedores.filter(e => e.estado === currentFilter);
    const tbody = document.getElementById('emprendedores-table-body');
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No hay registros para mostrar</td></tr>`;
        return;
    }
    tbody.innerHTML = filteredData.map((emp, index) => `
        <tr class="${emp.estado}">
            <td>${index + 1}</td>
            <td>${emp.nombres || ''}</td>
            <td>${emp.documento || ''}</td>
            <td>${emp.correo || ''}</td>
            <td>${emp.celular || ''}</td>
            <td>${emp.nombre_emprendimiento || ''}</td>
            <td>${emp.linea_negocio || ''}</td>
            <td>${renderStatusDropdown(emp)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary" onclick="viewDetails(${emp.id})">👁</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderStatusDropdown(emp) {
    const status = emp.estado || 'pendiente';
    return `
        <div class="status-dropdown" id="dropdown-${emp.id}">
            <span class="status-badge-clickable status-badge status-${status}" onclick="toggleStatusDropdown(${emp.id})">
                ${status}
            </span>
            <div class="status-dropdown-menu" id="menu-${emp.id}">
                <div class="status-dropdown-item ${status === 'pendiente' ? 'active' : ''}" onclick="selectStatus(${emp.id}, 'pendiente')">
                    <span class="dot dot-pendiente"></span> Pendiente
                </div>
                <div class="status-dropdown-item ${status === 'aprobado' ? 'active' : ''}" onclick="selectStatus(${emp.id}, 'aprobado')">
                    <span class="dot dot-aprobado"></span> Aprobado
                </div>
                <div class="status-dropdown-item ${status === 'rechazado' ? 'active' : ''}" onclick="selectStatus(${emp.id}, 'rechazado')">
                    <span class="dot dot-rechazado"></span> Rechazado
                </div>
            </div>
        </div>
    `;
}

function toggleStatusDropdown(id) {
    const menu = document.getElementById(`menu-${id}`);
    const wasOpen = menu.classList.contains('show');
    closeAllDropdowns();
    if (!wasOpen) {
        const badge = document.getElementById(`dropdown-${id}`).querySelector('.status-badge-clickable');
        const rect = badge.getBoundingClientRect();
        menu.style.top = rect.bottom + 4 + 'px';
        menu.style.left = Math.min(rect.left, window.innerWidth - 180) + 'px';
        menu.classList.add('show');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.status-dropdown-menu.show').forEach(m => m.classList.remove('show'));
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-dropdown')) closeAllDropdowns();
});

async function selectStatus(id, newStatus) {
    closeAllDropdowns();
    const statusLabels = { 'aprobado': 'Aprobado', 'pendiente': 'Pendiente', 'rechazado': 'Rechazado' };
    const result = await updateEmprendedor(id, { estado: newStatus });
    if (result.success) {
        emprendedores = await getEmprendedores();
        await updateDashboard();
        renderEmprendedores();
        const toastType = { aprobado: 'success', pendiente: 'pending', rechazado: 'rejected' };
        showToast(`Estado cambiado a ${statusLabels[newStatus]}`, toastType[newStatus]);
    } else {
        showToast('Error al actualizar el estado', 'error');
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✗'}</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function viewDetails(id) {
    const emp = emprendedores.find(e => e.id === id);
    if (!emp) return;
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="detail-row"><span class="detail-label">Nombres:</span><span class="detail-value">${emp.nombres || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Documento:</span><span class="detail-value">${emp.documento || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Correo:</span><span class="detail-value">${emp.correo || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Celular:</span><span class="detail-value">${emp.celular || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Emprendimiento:</span><span class="detail-value">${emp.nombre_emprendimiento || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Tipo Participante:</span><span class="detail-value">${emp.tipo_participante || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Línea Negocio:</span><span class="detail-value">${emp.linea_negocio || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Redes Sociales:</span><span class="detail-value">${emp.redes_sociales || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Acompañante:</span><span class="detail-value">${emp.acompanante || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Elementos:</span><span class="detail-value">${emp.elementos || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Productos/Servicios:</span><span class="detail-value">${emp.productos || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Requerimientos:</span><span class="detail-value">${emp.requerimientos || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Jornada Prep.:</span><span class="detail-value">${emp.jornada_preparacion || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Estado:</span><span class="detail-value"><span class="status-badge status-${emp.estado}">${emp.estado}</span></span></div>
        <div class="detail-row"><span class="detail-label">Fecha Registro:</span><span class="detail-value">${emp.created_at ? new Date(emp.created_at).toLocaleString() : '-'}</span></div>
    `;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('detail-modal').style.display = 'none'; }

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No hay usuarios registrados</td></tr>`;
        return;
    }
    tbody.innerHTML = usuarios.map(user => `
        <tr>
            <td>${user.id ? String(user.id).substring(0, 8) + '...' : '-'}</td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td><span class="status-badge status-aprobado">${user.rol}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary" onclick="editUser('${user.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="handleDeleteUser('${user.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleAddUser(e) {
    e.preventDefault();
    const nombre = document.getElementById('new-user-nombre').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const rol = document.getElementById('new-user-rol').value;
    const existingUser = usuarios.find(u => u.email === email);
    if (existingUser) { alert('Ya existe un usuario con ese correo electrónico'); return; }
    
    const result = await addUser({ nombre, email, password, rol });
    if (result.success) {
        usuarios = await getUsers();
        renderUsers();
        document.getElementById('add-user-form').reset();
        alert('Usuario agregado correctamente');
    } else alert('Error al agregar el usuario');
}

function editUser(id) {
    const user = usuarios.find(u => u.id === id);
    if (!user) return;
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-nombre').value = user.nombre;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-password').value = '';
    document.getElementById('edit-user-rol').value = user.rol;
    document.getElementById('edit-user-modal').style.display = 'flex';
}

async function handleEditUser(e) {
    e.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const nombre = document.getElementById('edit-user-nombre').value;
    const email = document.getElementById('edit-user-email').value;
    const password = document.getElementById('edit-user-password').value;
    const rol = document.getElementById('edit-user-rol').value;
    const existingUser = usuarios.find(u => u.email === email && u.id !== id);
    if (existingUser) { alert('Ya existe otro usuario con ese correo electrónico'); return; }
    
    const updates = { nombre, email, rol };
    if (password) updates.password = password;
    
    const result = await updateUser(id, updates);
    if (result.success) {
        usuarios = await getUsers();
        renderUsers();
        closeEditModal();
        alert('Usuario actualizado correctamente');
    } else alert('Error al actualizar el usuario');
}

async function handleDeleteUser(id) {
    id = String(id);
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    if (currentUser && id === String(currentUser.id)) { alert('No se puede eliminar su propio usuario'); return; }
    
    const result = await deleteUser(id);
    if (result.success) {
        usuarios = await getUsers();
        renderUsers();
        alert('Usuario eliminado correctamente');
    } else alert('Error al eliminar el usuario');
}

function closeEditModal() { document.getElementById('edit-user-modal').style.display = 'none'; }

const statusTitles = {
    aprobado: 'VI FEXPS - Emprendedores Aprobados',
    pendiente: 'VI FEXPS - Emprendedores Pendientes',
    rechazado: 'VI FEXPS - Emprendedores Rechazados'
};

function exportAll() { exportToExcel(emprendedores, 'emprendedores_fexp_todos', 'VI FEXPS - Todos los Emprendedores'); }
function exportFiltered(status) {
    const filtered = emprendedores.filter(e => e.estado === status);
    exportToExcel(filtered, `emprendedores_fexp_${status}`, statusTitles[status] || `VI FEXPS - Emprendedores ${status}`);
}

let formSuspended = false;

async function loadFormStatus() {
    const status = await getFormStatus();
    formSuspended = status.suspended;
    updateFormToggleButton();
}

function updateFormToggleButton() {
    const btn = document.getElementById('toggle-form-btn');
    const text = document.getElementById('form-status-text');
    if (!btn || !text) return;
    if (formSuspended) {
        btn.textContent = 'Activar Formulario';
        btn.className = 'btn btn-success';
        text.textContent = 'El formulario está suspendido. Los usuarios no pueden registrarse.';
        text.style.color = '#e74c3c';
    } else {
        btn.textContent = 'Suspender Formulario';
        btn.className = 'btn btn-warning';
        text.textContent = 'El formulario está activo. Los usuarios pueden registrarse.';
        text.style.color = '#27ae60';
    }
}

async function toggleFormStatus() {
    const newStatus = !formSuspended;
    const label = newStatus ? 'suspender' : 'activar';
    if (!confirm(`¿Está seguro de ${label} el formulario?`)) return;
    const result = await setFormStatus(newStatus);
    if (result.success) {
        formSuspended = newStatus;
        updateFormToggleButton();
    } else alert('Error al cambiar el estado del formulario');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeEditModal(); closeAllDropdowns(); }
});

document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeModal();
});

document.getElementById('edit-user-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-user-modal') closeEditModal();
});
