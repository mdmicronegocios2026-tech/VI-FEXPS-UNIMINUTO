// ============================================
// INSFORGE CLIENT - VI FEXPS
// ============================================

const INSFORGE_API = 'https://upc8i9ie.us-east.insforge.app';
const INSFORGE_ANON_KEY = 'anon_9c7b19fe7ebf07681163d8bb5542b451605c4a788bc7d48551a456e7bedaaa8e';

let USE_INSFORGE = false;

function initInsForge() {
    if (INSFORGE_API && INSFORGE_ANON_KEY) {
        USE_INSFORGE = true;
        console.log('InsForge inicializado correctamente');
        return true;
    }
    console.log('InsForge no configurado - usando modo local (localStorage)');
    USE_INSFORGE = false;
    return false;
}

// ==================== REST HELPERS ====================

async function _insforgeGet(table, query = '') {
    const url = `${INSFORGE_API}/api/database/records/${table}?${query}`;
    const res = await fetch(url, {
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    return res.json();
}

async function _insforgePost(table, data) {
    const url = `${INSFORGE_API}/api/database/records/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(Array.isArray(data) ? data : [data])
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}: ${res.statusText}`);
    }
    return res.json();
}

async function _insforgePatch(table, data, filter) {
    const url = `${INSFORGE_API}/api/database/records/${table}?${filter}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}: ${res.statusText}`);
    }
    return res.json();
}

async function _insforgeDelete(table, filter) {
    const url = `${INSFORGE_API}/api/database/records/${table}?${filter}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}: ${res.statusText}`);
    }
    return true;
}

// ==================== AUTH ====================

async function insforgeSignUp(email, password, name) {
    const res = await fetch(`${INSFORGE_API}/api/auth/users`, {
        method: 'POST',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
    }
    return res.json();
}

async function insforgeSignIn(email, password) {
    const res = await fetch(`${INSFORGE_API}/api/auth/sessions`, {
        method: 'POST',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || `Error ${res.status}`);
        err.code = data.error || 'UNKNOWN';
        err.status = res.status;
        throw err;
    }
    return data;
}

async function insforgeGetUser(accessToken) {
    const res = await fetch(`${INSFORGE_API}/api/auth/sessions/current`, {
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
}

async function insforgeSignOut(accessToken) {
    await fetch(`${INSFORGE_API}/api/auth/logout`, {
        method: 'POST',
        headers: {
            'apikey': INSFORGE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    sessionStorage.removeItem('insforge_access_token');
}

function _getStoredToken() {
    return sessionStorage.getItem('insforge_access_token');
}

function _storeToken(token) {
    sessionStorage.setItem('insforge_access_token', token);
}

function _clearToken() {
    sessionStorage.removeItem('insforge_access_token');
}

// ==================== SESIÓN ====================

async function getSupabaseSession() {
    if (!USE_INSFORGE) return null;
    const token = _getStoredToken();
    if (!token) return null;
    try {
        const user = await insforgeGetUser(token);
        if (!user || !user.id) { _clearToken(); return null; }
        return { user, access_token: token };
    } catch {
        _clearToken();
        return null;
    }
}

async function signOutAuth() {
    if (!USE_INSFORGE) return;
    const token = _getStoredToken();
    if (token) await insforgeSignOut(token);
    _clearToken();
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
    if (!USE_INSFORGE) {
        const users = _localGetUsers();
        return users.find(u => u.email === email && u.password === password) || null;
    }

    try {
        const authData = await insforgeSignIn(email, password);
        if (!authData.accessToken) return null;
        _storeToken(authData.accessToken);

        const userId = authData.user?.id;
        if (!userId) return { id: userId, email, nombre: email, rol: 'admin' };

        try {
            const profiles = await _insforgeGet('usuarios', `id=eq.${userId}&select=*`);
            if (profiles && profiles.length > 0) return profiles[0];
        } catch {}

        return { id: userId, email, nombre: email, rol: 'admin' };
    } catch (err) {
        if (err.code === 'EMAIL_NOT_VERIFIED' || err.status === 403) {
            throw new Error('Email no verificado. Verifica tu correo electrónico.');
        }
        if (err.code === 'INVALID_CREDENTIALS' || err.status === 401) {
            throw new Error('Credenciales incorrectas');
        }
        console.error('Error al autenticar:', err);
        throw err;
    }
}

// ==================== GESTIÓN ====================

async function getUsers() {
    if (!USE_INSFORGE) return _localGetUsers();
    try {
        const data = await _insforgeGet('usuarios', 'select=*&order=id.asc');
        return data || [];
    } catch { return []; }
}

async function addUser(userData) {
    if (!USE_INSFORGE) {
        const users = _localGetUsers();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, ...userData };
        users.push(newUser);
        _localSaveUsers(users);
        return { success: true, user: newUser };
    }

    try {
        const result = await insforgeSignUp(userData.email, userData.password, userData.nombre);
        const userId = result.user?.id;

        if (userId) {
            try {
                await _insforgePost('usuarios', {
                    id: userId,
                    nombre: userData.nombre,
                    email: userData.email,
                    rol: userData.rol || 'admin'
                });
            } catch {}
        }

        if (result.requireEmailVerification) {
            return { success: true, user: { id: userId, ...userData }, requireEmailVerification: true };
        }

        return { success: true, user: { id: userId, ...userData } };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function updateUser(id, userData) {
    if (!USE_INSFORGE) {
        const users = _localGetUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return { success: false, error: 'Usuario no encontrado' };
        if (!userData.password) userData.password = users[index].password;
        users[index] = { ...users[index], ...userData };
        _localSaveUsers(users);
        return { success: true, user: users[index] };
    }

    try {
        const updates = { ...userData };
        delete updates.password;
        delete updates.id;

        const data = await _insforgePatch('usuarios', updates, `id=eq.${id}&select=*`);
        return { success: true, user: data[0] || updates };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function deleteUser(id) {
    if (!USE_INSFORGE) {
        const users = _localGetUsers();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return { success: false, error: 'Usuario no encontrado' };
        _localSaveUsers(filtered);
        return { success: true };
    }
    try {
        await _insforgeDelete('usuarios', `id=eq.${id}`);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function getEmprendedores() {
    if (!USE_INSFORGE) return _localGetEmprendedores();
    try {
        const data = await _insforgeGet('emprendedores', 'select=*&order=created_at.desc');
        return data || [];
    } catch { return []; }
}

async function addEmprendedor(empData) {
    if (!USE_INSFORGE) {
        const emprendedores = _localGetEmprendedores();
        const newId = emprendedores.length > 0 ? Math.max(...emprendedores.map(e => e.id)) + 1 : 1;
        const newEmprendedor = { id: newId, ...empData, estado: 'pendiente', created_at: new Date().toISOString() };
        emprendedores.push(newEmprendedor);
        _localSaveEmprendedores(emprendedores);
        return { success: true, data: newEmprendedor };
    }

    try {
        const payload = { ...empData, estado: 'pendiente' };
        const data = await _insforgePost('emprendedores', payload);
        return { success: true, data: Array.isArray(data) ? data[0] : data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function updateEmprendedor(id, updates) {
    if (!USE_INSFORGE) {
        const emprendedores = _localGetEmprendedores();
        const index = emprendedores.findIndex(e => e.id === id);
        if (index === -1) return { success: false, error: 'Registro no encontrado' };
        emprendedores[index] = { ...emprendedores[index], ...updates };
        _localSaveEmprendedores(emprendedores);
        return { success: true, data: emprendedores[index] };
    }

    try {
        const data = await _insforgePatch('emprendedores', updates, `id=eq.${id}&select=*`);
        return { success: true, data: data[0] || updates };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function deleteEmprendedor(id) {
    if (!USE_INSFORGE) {
        const emprendedores = _localGetEmprendedores();
        const filtered = emprendedores.filter(e => e.id !== id);
        if (filtered.length === emprendedores.length) return { success: false, error: 'Registro no encontrado' };
        _localSaveEmprendedores(filtered);
        return { success: true };
    }

    try {
        await _insforgeDelete('emprendedores', `id=eq.${id}`);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function getFormStatus() {
    if (!USE_INSFORGE) return { suspended: false };
    try {
        const data = await _insforgeGet('config', 'select=value&key=eq.form_suspended');
        if (!data || data.length === 0) return { suspended: false };
        return { suspended: data[0].value === 'true' };
    } catch {
        return { suspended: false };
    }
}

async function setFormStatus(suspended) {
    if (!USE_INSFORGE) return { success: false };
    try {
        await _insforgePatch('config', { value: String(suspended), updated_at: new Date().toISOString() }, 'key=eq.form_suspended');
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function exportToExcel(data, filename, title) {
    if (typeof ExcelJS === 'undefined') { alert('Librería ExcelJS no cargada'); return false; }
    if (!data || data.length === 0) { alert('No hay datos para exportar'); return false; }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Emprendedores', { properties: { defaultColWidth: 15 } });

    const colCount = 15;
    const lastCol = String.fromCharCode(64 + colCount);

    sheet.mergeCells(`A1:${lastCol}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = title || 'VI FEXPS - Reporte de Emprendedores';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 38;

    const headers = ['#', 'Nombres', 'Documento', 'Correo', 'Celular', 'Emprendimiento', 'Tipo Participante', 'Línea Negocio', 'Redes Sociales', 'Acompañante', 'Elementos', 'Productos/Servicios', 'Requerimientos', 'Jornada Prep.', 'Estado'];
    const headerRow = sheet.getRow(2);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF1A252F' } },
            bottom: { style: 'thin', color: { argb: 'FF1A252F' } },
            left: { style: 'thin', color: { argb: 'FF1A252F' } },
            right: { style: 'thin', color: { argb: 'FF1A252F' } }
        };
    });
    headerRow.height = 30;

    const statusColors = {
        pendiente: { bg: 'FFFFF3CD', fg: 'FF856404' },
        aprobado: { bg: 'FFD4EDDA', fg: 'FF155724' },
        rechazado: { bg: 'FFF8D7DA', fg: 'FF721C24' }
    };

    data.forEach((emp, i) => {
        const rowNum = i + 3;
        const row = sheet.getRow(rowNum);
        const isEven = i % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF8F9FA';

        const rowData = [
            i + 1,
            emp.nombres || '',
            emp.documento || '',
            emp.correo || '',
            emp.celular || '',
            emp.nombre_emprendimiento || '',
            emp.tipo_participante || '',
            emp.linea_negocio || '',
            emp.redes_sociales || '',
            emp.acompanante || '',
            emp.elementos || '',
            emp.productos || '',
            emp.requerimientos || '',
            emp.jornada_preparacion || '',
            emp.estado || ''
        ];

        rowData.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.value = val;
            cell.font = { size: 10, name: 'Calibri' };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
            };

            if (colIdx === 0) cell.alignment = { horizontal: 'center', vertical: 'middle' };

            if (colIdx === 14) {
                const status = (val || '').toLowerCase();
                const colors = statusColors[status] || { bg: rowBg, fg: 'FF333333' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
                cell.font = { bold: true, size: 10, color: { argb: colors.fg }, name: 'Calibri' };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            }
        });

        row.height = 22;
    });

    const colWidths = [5, 28, 15, 28, 14, 28, 22, 22, 24, 24, 28, 35, 28, 16, 14];
    colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    sheet.views = [{ state: 'frozen', ySplit: 2 }];

    const date = new Date().toISOString().split('T')[0];
    const fileName = filename ? `${filename}_${date}.xlsx` : `emprendedores_fexp_${date}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
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
