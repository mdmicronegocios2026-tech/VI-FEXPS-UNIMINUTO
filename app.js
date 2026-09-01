// ============================================
// VI FEXPS - FORMULARIO PÚBLICO
// ============================================

// ==================== NAVEGACIÓN ENTRE VISTAS ====================

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
}

function showAdminDashboard() {
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-main-screen').style.display = 'block';
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    initForm();
});

function initForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    form.addEventListener('submit', handleSubmit);
    
    // Validación en tiempo real
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearError(field));
    });
}

// ==================== ENVÍO DEL FORMULARIO ====================

async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validar todos los campos
    if (!validateForm(form)) {
        return;
    }
    
    // Verificar checkboxes requeridos
    if (!validateCheckboxes(form)) {
        return;
    }
    
    // Verificar radio buttons requeridos
    if (!validateRadios(form)) {
        return;
    }
    
    // Recopilar datos
    const formData = collectFormData(form);
    
    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const result = addEmprendedor(formData);
        
        if (result.success) {
            showSuccess();
        } else {
            showError('Error al enviar el registro. Intente nuevamente.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al enviar el registro. Intente nuevamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Registro';
    }
}

// ==================== VALIDACIONES ====================

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';
    
    if (field.required && !value) {
        isValid = false;
        message = 'Este campo es obligatorio';
    } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            message = 'Ingrese un correo electrónico válido';
        }
    }
    
    if (!isValid) {
        showFieldError(field, message);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function validateCheckboxes(form) {
    const checkboxGroups = {};
    
    form.querySelectorAll('input[type="checkbox"][name="elementos"]').forEach(cb => {
        if (!checkboxGroups['elementos']) {
            checkboxGroups['elementos'] = [];
        }
        checkboxGroups['elementos'].push(cb);
    });
    
    if (checkboxGroups['elementos']) {
        const anyChecked = checkboxGroups['elementos'].some(cb => cb.checked);
        if (!anyChecked) {
            showGroupError('Seleccione al menos un elemento');
            return false;
        }
        clearGroupError('elementos');
    }
    
    return true;
}

function validateRadios(form) {
    const radioName = 'jornada_preparacion';
    const radios = form.querySelectorAll(`input[name="${radioName}"]`);
    const anyChecked = Array.from(radios).some(r => r.checked);
    
    if (!anyChecked) {
        showGroupError('Seleccione si está dispuesto a asistir a la jornada de preparación');
        return false;
    }
    
    clearGroupError(radioName);
    return true;
}

function collectFormData(form) {
    const data = {};
    
    // Autorización
    data.autorizacion = form.querySelector('#autorizacion').checked;
    
    // Campos de texto y selects
    const fields = ['actividad', 'tipo_participante', 'nombres', 'documento', 
                    'correo', 'celular', 'nombre_emprendimiento', 'linea_negocio', 
                    'redes_sociales', 'acompanante', 'productos', 'requerimientos'];
    
    fields.forEach(field => {
        const element = form.querySelector(`#${field}`);
        data[field] = element ? element.value.trim() : '';
    });
    
    // Checkboxes de elementos
    const elementos = [];
    form.querySelectorAll('input[name="elementos"]:checked').forEach(cb => {
        elementos.push(cb.value);
    });
    data.elementos = elementos.join(', ');
    
    // Radio button
    const jornada = form.querySelector('input[name="jornada_preparacion"]:checked');
    data.jornada_preparacion = jornada ? jornada.value : '';
    
    return data;
}

// ==================== ERRORES Y ÉXITO ====================

function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#e74c3c';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const error = field.parentNode.querySelector('.field-error');
    if (error) error.remove();
}

function showGroupError(message) {
    clearGroupError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'group-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.textContent = message;
    
    const checkboxes = document.querySelector('.checkbox-group');
    if (checkboxes) {
        checkboxes.parentNode.appendChild(errorDiv);
    }
}

function clearGroupError() {
    const errors = document.querySelectorAll('.group-error');
    errors.forEach(e => e.remove());
}

function showError(message) {
    alert(message);
}

function showSuccess() {
    document.getElementById('registrationForm').classList.add('hidden');
    document.getElementById('successMessage').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearError(field) {
    clearFieldError(field);
}