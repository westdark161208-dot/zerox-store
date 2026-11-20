import {apiBase, appearance, defaults, sections, settingsPath, validValue} from './manual-recharges.mjs';

const form = document.getElementById('manual-appearance');
const select = form.elements.section;
const fields = form.querySelector('[data-manual-fields]');
const status = form.querySelector('[role=status]');
const save = form.querySelector('[type=submit]');
const reload = form.querySelector('[data-reload]');
const uploads = new Map();
const previews = new Map();
let values = {...defaults};
let revision = null;
let owner;
let sequence = 0;
let busy = false;

function session() {
  try { return JSON.parse(localStorage.getItem('zerox-session'))?.token; } catch { return null; }
}
function lock() {
  form.querySelector('fieldset').disabled = busy || revision === null;
  save.disabled = busy || revision === null;
  reload.disabled = busy;
  select.disabled = busy;
}
function reset() {
  sequence++;
  for (const url of previews.values()) URL.revokeObjectURL(url);
  previews.clear();
  uploads.clear();
  revision = null;
  values = {...defaults};
  owner = null;
  busy = false;
  status.textContent = '';
  fields.replaceChildren();
  lock();
}
for (const [value, name] of Object.entries(sections)) select.add(new Option(name, value));

function draw() {
  fields.replaceChildren();
  for (const f of appearance.filter(f => f.section === select.value)) {
    const label = document.createElement('label');
    label.textContent = f.label;
    if (f.limit === 'image') {
      const img = new Image();
      img.src = previews.get(f.key) || values[f.key];
      img.alt = f.label;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 8000000) {
          input.value = '';
          status.textContent = 'Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.';
          return;
        }
        if (previews.has(f.key)) URL.revokeObjectURL(previews.get(f.key));
        uploads.set(f.key, file);
        previews.set(f.key, URL.createObjectURL(file));
        img.src = previews.get(f.key);
      };
      label.append(img, input);
    } else {
      const input = document.createElement(f.limit > 100 ? 'textarea' : 'input');
      input.value = values[f.key];
      input.maxLength = f.limit;
      input.required = true;
      input.oninput = () => { values[f.key] = input.value; };
      label.append(input);
    }
    fields.append(label);
  }
}
select.onchange = draw;

async function load() {
  reset();
  owner = session();
  if (!owner) return;
  const run = sequence;
  busy = true;
  lock();
  status.textContent = 'Cargando apariencia…';
  try {
    const response = await fetch(settingsPath, {cache:'no-store'});
    if (!response.ok) throw Error();
    const result = await response.json();
    if (run !== sequence || owner !== session()) return;
    if (typeof result.revision !== 'string' || !result.values) throw Error();
    values = {...defaults, ...result.values};
    revision = result.revision;
    draw();
    status.textContent = '';
  } catch { if (run === sequence) status.textContent = 'No se pudo cargar la apariencia. Vuelve a cargar para reintentar.'; }
  finally { if (run === sequence) { busy = false; lock(); } }
}
function loadSection() {
  if (location.hash === '#recargas-manuales' && !document.getElementById('workspace').hidden &&
      (!owner || owner !== session())) load();
}
window.addEventListener('hashchange', loadSection);
window.addEventListener('zx-control-ready', loadSection);
window.addEventListener('storage', e => { if (!e.key || e.key === 'zerox-session') reset(); });
window.addEventListener('pagehide', reset);
window.addEventListener('zx-control-clear', () => { if (owner !== session()) reset(); });
reload.onclick = load;
loadSection();

form.onsubmit = async event => {
  event.preventDefault();
  if (busy || revision === null || !owner || session() !== owner) return;
  const invalid = appearance.find(f => !validValue(f, values[f.key]));
  if (invalid) {
    select.value = invalid.section;
    draw();
    status.textContent = 'Revisa el campo «' + invalid.label + '».';
    return;
  }
  const run = sequence;
  const token = owner;
  const headers = {Authorization: 'Bearer ' + token};
  busy = true;
  lock();
  status.textContent = 'Publicando…';
  try {
    for (const [key, file] of uploads) {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(apiBase + '/api/admin/catalog/media', {method:'POST', headers, body});
      if (!response.ok) throw Error('No se pudo subir la imagen.');
      const {url} = await response.json();
      if (run !== sequence || session() !== token) return;
      if (!validValue(appearance.find(f => f.key === key), url)) throw Error('La imagen recibida no es válida.');
      values[key] = url;
      uploads.delete(key);
    }
    const response = await fetch(settingsPath, {method:'POST', headers:{...headers, 'Content-Type':'application/json'},
      body:JSON.stringify({revision, values})});
    if (run !== sequence || session() !== token) return;
    if (response.status === 409) {
      revision = null;
      throw Error('Hay una versión más reciente. Vuelve a cargar antes de editar.');
    }
    if (!response.ok) {
      const {error} = await response.json().catch(() => ({}));
      const messages = {
        UNAUTHORIZED: 'Tu sesión venció. Inicia sesión en la tienda y vuelve a publicar.',
        FORBIDDEN: 'Solo la cuenta fundadora puede publicar estos cambios.',
        IDENTITY_UNAVAILABLE: 'No se pudo consultar tu sesión. Conserva esta pantalla y vuelve a pulsar Publicar cambios.',
        STORAGE_UNAVAILABLE: 'El almacenamiento no está disponible. Conserva esta pantalla y vuelve a pulsar Publicar cambios.',
        INVALID_APPEARANCE: 'Revisa los textos y las imágenes antes de volver a publicar.'
      };
      throw Error(messages[error] || 'No se pudo publicar. Tus cambios siguen en el formulario. Inténtalo de nuevo.');
    }
    const result = await response.json();
    if (run !== sequence || session() !== token) return;
    revision = result.revision;
    values = result.values;
    for (const url of previews.values()) URL.revokeObjectURL(url);
    previews.clear();
    draw();
    status.textContent = 'Cambios publicados en la tienda.';
  } catch (error) { if (run === sequence) status.textContent = error.message; }
  finally { if (run === sequence) { busy = false; lock(); } }
};
