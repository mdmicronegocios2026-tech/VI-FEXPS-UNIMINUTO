// ============================================
// VI FEXPS - FORMULARIO PÚBLICO
// ============================================

function showAdminLogin() {
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('admin-login-screen').style.display = 'flex';
    document.getElementById('admin-main-screen').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('registration-section').style.display = 'block';
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-main-screen').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
    checkFormSuspension(); // Re-evaluar por si se activó/desactivó
}

function showAdminDashboard() {
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-main-screen').style.display = 'block';
}

let formSuspendedPublic = false;

document.addEventListener('DOMContentLoaded', async function() {
    initSupabase();
    initForm();
    await checkFormSuspension();
});

async function checkFormSuspension() {
    const status = await getFormStatus();
    formSuspendedPublic = status.suspended;

    if (formSuspendedPublic) {
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('suspendedMessage').classList.remove('hidden');
    } else {
        document.getElementById('registrationForm').style.display = 'block';
        document.getElementById('suspendedMessage').classList.add('hidden');
    }
}

function initForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    form.addEventListener('submit', handleSubmit);
    
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearError(field));
    });
}

async function handleSubmit(e) {
    e.preventDefault();
    if (formSuspendedPublic) {
        alert('El formulario de registro se encuentra suspendido. Intente más tarde.');
        return;
    }
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!validateForm(form)) return;
    if (!validateCheckboxes(form)) return;
    if (!validateRadios(form)) return;
    
    const formData = collectFormData(form);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const result = await addEmprendedor(formData);
        if (result.success) showSuccess();
        else showError('Error al enviar el registro. Intente nuevamente.');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al enviar el registro. Intente nuevamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Registro';
    }
}

function validateForm(form) {
    let isValid = true;
    form.querySelectorAll('[required]').forEach(field => {
        if (!validateField(field)) isValid = false;
    });
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';
    
    if (field.required && !value) {
        isValid = false; message = 'Este campo es obligatorio';
    } else if (field.type === 'email' && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false; message = 'Ingrese un correo electrónico válido';
        }
    }
    
    if (!isValid) showFieldError(field, message);
    else clearFieldError(field);
    return isValid;
}

function validateCheckboxes(form) {
    const cbs = Array.from(form.querySelectorAll('input[type="checkbox"][name="elementos"]'));
    if (cbs.length > 0 && !cbs.some(cb => cb.checked)) {
        showGroupError('Seleccione al menos un elemento');
        return false;
    }
    clearGroupError('elementos');
    return true;
}

function validateRadios(form) {
    const radios = Array.from(form.querySelectorAll('input[name="jornada_preparacion"]'));
    if (radios.length > 0 && !radios.some(r => r.checked)) {
        showGroupError('Seleccione si está dispuesto a asistir a la jornada de preparación');
        return false;
    }
    clearGroupError('jornada_preparacion');
    return true;
}

function collectFormData(form) {
    const data = { autorizacion: form.querySelector('#autorizacion').checked };
    const fields = ['actividad', 'tipo_participante', 'nombres', 'documento', 'correo', 'celular', 'nombre_emprendimiento', 'linea_negocio', 'redes_sociales', 'acompanante', 'productos', 'requerimientos'];
    fields.forEach(f => {
        const el = form.querySelector(`#${f}`);
        data[f] = el ? el.value.trim() : '';
    });
    const elementos = [];
    form.querySelectorAll('input[name="elementos"]:checked').forEach(cb => elementos.push(cb.value));
    data.elementos = elementos.join(', ');
    const jornada = form.querySelector('input[name="jornada_preparacion"]:checked');
    data.jornada_preparacion = jornada ? jornada.value : '';
    return data;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#e74c3c';
    const err = document.createElement('div');
    err.className = 'field-error';
    err.style.color = '#e74c3c';
    err.style.fontSize = '0.875rem';
    err.style.marginTop = '0.25rem';
    err.textContent = message;
    field.parentNode.appendChild(err);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const err = field.parentNode.querySelector('.field-error');
    if (err) err.remove();
}

function showGroupError(message) {
    clearGroupError();
    const err = document.createElement('div');
    err.className = 'group-error';
    err.style.color = '#e74c3c';
    err.style.fontSize = '0.875rem';
    err.style.marginTop = '0.5rem';
    err.textContent = message;
    const checkboxes = document.querySelector('.checkbox-group');
    if (checkboxes) checkboxes.parentNode.appendChild(err);
}

function clearGroupError() {
    document.querySelectorAll('.group-error').forEach(e => e.remove());
}

function showError(message) { alert(message); }

function showSuccess() {
    document.getElementById('registrationForm').classList.add('hidden');
    document.getElementById('successMessage').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearError(field) { clearFieldError(field); }
