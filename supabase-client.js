// ============================================
// SUPABASE CLIENT - VI FEXPS
// ============================================

const SUPABASE_URL = 'https://qtgholcwqvrrvxyqrdjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Z2hvbGN3cXZycnZ4eXFyZGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTc5ODQsImV4cCI6MjEwMzkzMzk4NH0.hwMJzaJf8qwjYNSOXKrC1yACxf-blgLTVk9rjtZT8gY';

let supabaseClient = null;
let USE_SUPABASE = false;

function initSupabase() {
    const configured = SUPABASE_URL !== 'TU_URL_DE_SUPABASE' &&
                        SUPABASE_ANON_KEY !== 'TU_ANON_KEY' &&
                        typeof window.supabase !== 'undefined';

    if (configured) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        USE_SUPABASE = true;
        console.log('Supabase inicializado correctamente');
        return true;
    }

    console.log('Supabase no configurado - usando modo local (localStorage)');
    USE_SUPABASE = false;
    return false;
}

// ==================== SESIÓN ====================

async function getSupabaseSession() {
    if (!USE_SUPABASE) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

async function signOutAuth() {
    if (!USE_SUPABASE) return;
    await supabaseClient.auth.signOut();
}

// ==================== HELPERS LOCALES ====================

function _localGetUsers() {
    const data = localStorage.getItem('fexp_users');
    return data ? JSON.parse(data) : _localGetInitialUsers();
}

function _localSaveUsers(users) {
    localStorage.setItem('fexp_users', JSON.stringify(users));
}

function _localGetInitialUsers() {
    const initialUsers = [{ id: 1, email: 'admin@fexp.com', password: 'admin123', nombre: 'Administrador General', rol: 'admin' }];
    _localSaveUsers(initialUsers);
    return initialUsers;
}

function _localGetEmprendedores() {
    const data = localStorage.getItem('fexp_emprendedores');
    return data ? JSON.parse(data) : [];
}

function _localSaveEmprendedores(data) {
    localStorage.setItem('fexp_emprendedores', JSON.stringify(data));
}

// ==================== AUTENTICACIÓN ====================

async function authenticateUser(email, password) {
    if (!USE_SUPABASE) {
        const users = _localGetUsers();
        return users.find(u => u.email === email && u.password === password) || null;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
    if (error) { console.error('Error al autenticar:', error); return null; }

    const { data: profile, error: profileError } = await supabaseClient.from('usuarios').select('*').eq('id', data.user.id).maybeSingle();
    if (profileError || !profile) {
        return { id: data.user.id, email: data.user.email, nombre: data.user.email, rol: 'admin' };
    }
    return profile;
}

// ==================== GESTIÓN ====================

async function getUsers() {
    if (!USE_SUPABASE) return _localGetUsers();
    const { data, error } = await supabaseClient.from('usuarios').select('*').order('id', { ascending: true });
    return error ? [] : data;
}

async function addUser(userData) {
    if (!USE_SUPABASE) {
        const users = _localGetUsers();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, ...userData };
        users.push(newUser);
        _localSaveUsers(users);
        return { success: true, user: newUser };
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email: userData.email, password: userData.password });
    if (authError) return { success: false, error: authError.message };

    const { error: profileError } = await supabaseClient.from('usuarios').insert([{ id: authData.user.id, nombre: userData.nombre, email: userData.email, rol: userData.rol || 'admin' }]);
    return profileError ? { success: false, error: profileError.message } : { success: true, user: { id: authData.user.id, ...userData } };
}

async function updateUser(id, userData) {
    if (!USE_SUPABASE) {
        const users = _localGetUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return { success: false, error: 'Usuario no encontrado' };
        if (!userData.password) userData.password = users[index].password;
        users[index] = { ...users[index], ...userData };
        _localSaveUsers(users);
        return { success: true, user: users[index] };
    }

    const updates = { ...userData };
    if (updates.password) {
        const { error: authError } = await supabaseClient.auth.updateUser({ password: updates.password });
        if (authError) return { success: false, error: authError.message };
        delete updates.password;
    }

    const { data, error } = await supabaseClient.from('usuarios').update(updates).eq('id', id).select().single();
    return error ? { success: false, error: error.message } : { success: true, user: data };
}

async function deleteUser(id) {
    if (!USE_SUPABASE) {
        const users = _localGetUsers();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return { success: false, error: 'Usuario no encontrado' };
        _localSaveUsers(filtered);
        return { success: true };
    }
    const { error } = await supabaseClient.from('usuarios').delete().eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
}

async function getEmprendedores() {
    if (!USE_SUPABASE) return _localGetEmprendedores();
    const { data, error } = await supabaseClient.from('emprendedores').select('*').order('created_at', { ascending: false });
    return error ? [] : data;
}

async function addEmprendedor(empData) {
    if (!USE_SUPABASE) {
        const emprendedores = _localGetEmprendedores();
        const newId = emprendedores.length > 0 ? Math.max(...emprendedores.map(e => e.id)) + 1 : 1;
        const newEmprendedor = { id: newId, ...empData, estado: 'pendiente', created_at: new Date().toISOString() };
        emprendedores.push(newEmprendedor);
        _localSaveEmprendedores(emprendedores);
        return { success: true, data: newEmprendedor };
    }

    const payload = { ...empData, estado: 'pendiente' };
    const { data, error } = await supabaseClient.from('emprendedores').insert([payload]).select().single();
    return error ? { success: false, error: error.message } : { success: true, data };
}

async function updateEmprendedor(id, updates) {
    if (!USE_SUPABASE) {
        const emprendedores = _localGetEmprendedores();
        const index = emprendedores.findIndex(e => e.id === id);
        if (index === -1) return { success: false, error: 'Registro no encontrado' };
        emprendedores[index] = { ...emprendedores[index], ...updates };
        _localSaveEmprendedores(emprendedores);
        return { success: true, data: emprendedores[index] };
    }

    const { data, error } = await supabaseClient.from('emprendedores').update(updates).eq('id', id).select().single();
    return error ? { success: false, error: error.message } : { success: true, data };
}

async function deleteEmprendedor(id) {
    if (!USE_SUPABASE) {
        const emprendedores = _localGetEmprendedores();
        const filtered = emprendedores.filter(e => e.id !== id);
        if (filtered.length === emprendedores.length) return { success: false, error: 'Registro no encontrado' };
        _localSaveEmprendedores(filtered);
        return { success: true };
    }

    const { error } = await supabaseClient.from('emprendedores').delete().eq('id', id);
    return error ? { success: false, error: error.message } : { success: true };
}

async function getFormStatus() {
    if (!USE_SUPABASE) return { suspended: false };
    const { data, error } = await supabaseClient.from('config').select('value').eq('key', 'form_suspended').maybeSingle();
    return (error || !data) ? { suspended: false } : { suspended: data.value === 'true' };
}

async function setFormStatus(suspended) {
    if (!USE_SUPABASE) return { success: false };
    const { error } = await supabaseClient.from('config').update({ value: String(suspended), updated_at: new Date().toISOString() }).eq('key', 'form_suspended');
    return error ? { success: false, error: error.message } : { success: true };
}

function exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') { alert('Librería XLSX no cargada'); return false; }
    if (!data || data.length === 0) { alert('No hay datos para exportar'); return false; }

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
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, filename ? `${filename}_${date}.xlsx` : `emprendedores_fexp_${date}.xlsx`);
    return true;
}

async function getStats(data) {
    const emprendedores = data || await getEmprendedores();
    return {
        total: emprendedores.length,
        pendientes: emprendedores.filter(e => e.estado === 'pendiente').length,
        aprobados: emprendedores.filter(e => e.estado === 'aprobado').length,
        rechazados: emprendedores.filter(e => e.estado === 'rechazado').length
    };
}
