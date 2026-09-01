// ============================================
// SUPABASE CLIENT - VI FEXPS
// ============================================

// Configuración de Supabase
// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

// Inicializar cliente Supabase
let supabaseClient = null;

function initSupabase() {
    if (SUPABASE_URL !== 'TU_URL_DE_SUPABASE' && typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado correctamente');
        return true;
    }
    console.log('Supabase no configurado - usando modo local');
    return false;
}

// ==================== GESTIÓN DE USUARIOS ====================

function getUsers() {
    const data = localStorage.getItem('fexp_users');
    return data ? JSON.parse(data) : getInitialUsers();
}

function saveUsers(users) {
    localStorage.setItem('fexp_users', JSON.stringify(users));
}

function getInitialUsers() {
    const initialUsers = [
        {
            id: 1,
            email: 'admin@fexp.com',
            password: 'admin123',
            nombre: 'Administrador General',
            rol: 'admin'
        }
    ];
    saveUsers(initialUsers);
    return initialUsers;
}

function authenticateUser(email, password) {
    const users = getUsers();
    return users.find(u => u.email === email && u.password === password);
}

function addUser(userData) {
    const users = getUsers();
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
        id: newId,
        ...userData
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true, user: newUser };
}

function updateUser(id, userData) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        return { success: false, error: 'Usuario no encontrado' };
    }
    
    // Si no se proporciona nueva contraseña, mantener la actual
    if (!userData.password) {
        userData.password = users[index].password;
    }
    
    users[index] = { ...users[index], ...userData };
    saveUsers(users);
    return { success: true, user: users[index] };
}

function deleteUser(id) {
    const users = getUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    if (filteredUsers.length === users.length) {
        return { success: false, error: 'Usuario no encontrado' };
    }
    saveUsers(filteredUsers);
    return { success: true };
}

// ==================== GESTIÓN DE EMPRENDEDORES ====================

function getEmprendedores() {
    const data = localStorage.getItem('fexp_emprendedores');
    return data ? JSON.parse(data) : [];
}

function saveEmprendedores(data) {
    localStorage.setItem('fexp_emprendedores', JSON.stringify(data));
}

function addEmprendedor(empData) {
    const emprendedores = getEmprendedores();
    const newId = emprendedores.length > 0 ? Math.max(...emprendedores.map(e => e.id)) + 1 : 1;
    const newEmprendedor = {
        id: newId,
        ...empData,
        estado: 'pendiente',
        created_at: new Date().toISOString()
    };
    emprendedores.push(newEmprendedor);
    saveEmprendedores(emprendedores);
    return { success: true, data: newEmprendedor };
}

function updateEmprendedor(id, updates) {
    const emprendedores = getEmprendedores();
    const index = emprendedores.findIndex(e => e.id === id);
    
    if (index === -1) {
        return { success: false, error: 'Registro no encontrado' };
    }
    
    emprendedores[index] = { ...emprendedores[index], ...updates };
    saveEmprendedores(emprendedores);
    return { success: true, data: emprendedores[index] };
}

function deleteEmprendedor(id) {
    const emprendedores = getEmprendedores();
    const filtered = emprendedores.filter(e => e.id !== id);
    if (filtered.length === emprendedores.length) {
        return { success: false, error: 'Registro no encontrado' };
    }
    saveEmprendedores(filtered);
    return { success: true };
}

function getEmprendedoresByStatus(status) {
    const emprendedores = getEmprendedores();
    if (!status || status === 'todos') {
        return emprendedores;
    }
    return emprendedores.filter(e => e.estado === status);
}

// ==================== EXPORTAR DATOS ====================

function exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') {
        alert('Librería XLSX no cargada');
        return false;
    }
    
    if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return false;
    }
    
    // Formatear datos para exportar
    const formattedData = data.map(emp => ({
        'Nombres': emp.nombres || '',
        'Documento': emp.documento || '',
        'Correo': emp.correo || '',
        'Celular': emp.celular || '',
        'Emprendimiento': emp.nombre_emprendimiento || '',
        'Tipo': emp.tipo_participante || '',
        'Línea': emp.linea_negocio || '',
        'Redes Sociales': emp.redes_sociales || '',
        'Acompañante': emp.acompanante || '',
        'Elementos': emp.elementos || '',
        'Productos': emp.productos || '',
        'Requerimientos': emp.requerimientos || '',
        'Jornada Prep.': emp.jornada_preparacion || '',
        'Estado': emp.estado || '',
        'Fecha': emp.created_at ? new Date(emp.created_at).toLocaleString() : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emprendedores');
    
    // Generar nombre de archivo con fecha
    const date = new Date().toISOString().split('T')[0];
    const finalFilename = filename ? `${filename}_${date}.xlsx` : `emprendedores_fexp_${date}.xlsx`;
    
    XLSX.writeFile(wb, finalFilename);
    return true;
}

// ==================== ESTADÍSTICAS ====================

function getStats() {
    const emprendedores = getEmprendedores();
    return {
        total: emprendedores.length,
        pendientes: emprendedores.filter(e => e.estado === 'pendiente').length,
        aprobados: emprendedores.filter(e => e.estado === 'aprobado').length,
        rechazados: emprendedores.filter(e => e.estado === 'rechazado').length
    };
}