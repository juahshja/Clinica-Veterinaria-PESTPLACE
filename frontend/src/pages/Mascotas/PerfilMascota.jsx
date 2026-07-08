import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { petService, consultationService, addPendingCharge, userService, vaccineService } from '../../services/api';
import { 
  FiArrowLeft, FiPlus, FiPhone, FiDollarSign, 
  FiShield, FiFileText, FiMapPin, FiMail,
  FiDownload, FiTrash2, FiActivity, FiUpload, FiX
} from 'react-icons/fi';

const rightTabs = ['Resumen', 'Consultas', 'Vacunas', 'Documentos', 'Evolución'];

export default function PerfilMascota() {
  const { id } = useParams();
  const navigate = useNavigate();

  const pendingCharges = billingService.getPendingCharges(id) || [];
  const totalPending = pendingCharges.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);
  
  const [pet, setPet] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [vacunasCatalogo, setVacunasCatalogo] = useState([]);
  const [activeTab, setActiveTab] = useState('Resumen');
  const [loading, setLoading] = useState(true);

  // Estados para documentos
  const [documentos, setDocumentos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docDesc, setDocDesc] = useState('');
  const [showDocUploadForm, setShowDocUploadForm] = useState(false);

  // Estados para evolución
  const [evolucionLogs, setEvolucionLogs] = useState([]);
  const [evolPeso, setEvolPeso] = useState('');
  const [evolTemp, setEvolTemp] = useState('');
  const [evolFecha, setEvolFecha] = useState('2026-07-02');
  const [evolNotas, setEvolNotas] = useState('');

  // Estados para modales internos (agregar consulta / agregar vacuna)
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showVacunaModal, setShowVacunaModal] = useState(false);

  // Campos para agregar consulta
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [costo, setCosto] = useState('80');

  // Campos para veterinario
  const [veterinarios, setVeterinarios] = useState([]);
  const [veterinario, setVeterinario] = useState('');

  // Campos para agregar vacuna
  const [vacunaId, setVacunaId] = useState('');
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().split('T')[0]);

  const loadPetData = async () => {
    setLoading(true);
    const petDetails = await petService.getById(id);
    if (!petDetails) {
      navigate('/mascotas');
      return;
    }
    setPet(petDetails);

    const consultations = await petService.getConsultas(id);
    setConsultas(consultations);

    const vaccines = await petService.getVacunas(id);
    setVacunas(vaccines);

    const cat = await vaccineService.getAll();
    setVacunasCatalogo(cat || []);
    if (cat && cat.length > 0) {
      setVacunaId(cat[0].id.toString());
    }

    // Cargar documentos específicos del animal desde Supabase (inicialmente vacío sin pre-hechos)
    const docs = await petService.getDocumentos(id);
    setDocumentos(docs || []);

    // Cargar evolución específica del animal desde Supabase
    const evol = await petService.getEvolucion(id);
    if (evol) {
      setEvolucionLogs(evol);
    } else {
      setEvolucionLogs([]);
    }

    try {
      const users = await userService.getAll();
      const vets = users.filter(u => {
        const roleName = (u.rol && u.rol.nombre) ? u.rol.nombre.toUpperCase() : '';
        return roleName.includes('VET') || roleName.includes('VETERINARIO');
      });
      setVeterinarios(vets);
      
      let loggedUser = null;
      try {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) loggedUser = JSON.parse(savedUser);
      } catch (e) {}

      const defaultVet = vets.find(v => v.nombre === loggedUser?.nombre) || vets[0];
      if (defaultVet && !veterinario) {
        setVeterinario(defaultVet.nombre);
      }
    } catch (err) {
      console.warn("Could not load system veterinarians in PerfilMascota", err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadPetData();
  }, [id]);

  const handleCreateConsulta = async (e) => {
    e.preventDefault();
    const payload = {
      mascota: { id: Number(id) },
      motivo,
      diagnostico,
      tratamiento,
      medicamentos,
      costo: Number(costo),
      veterinario,
      fecha: new Date().toISOString().split('.')[0]
    };
    
    // Guardamos en el backend centralizado
    await consultationService.create(payload);
    
    // Generar cargo clínico pendiente para caja
    addPendingCharge(id, pet.nombre, pet.cliente?.nombre || 'Cliente', 'Consulta', `Consulta Médica: ${motivo}`, costo);

    setShowConsultaModal(false);
    setMotivo('');
    setDiagnostico('');
    setTratamiento('');
    setMedicamentos('');
    loadPetData();
    setActiveTab('Consultas');
  };

  const handleCreateVacuna = async (e) => {
    e.preventDefault();
    if (!vacunaId) {
      alert("Por favor, selecciona una vacuna del catálogo.");
      return;
    }
    const selectedVac = vacunasCatalogo.find(v => v.id.toString() === vacunaId.toString());
    const payload = {
      mascota: { id: Number(id) },
      vacuna: { id: Number(vacunaId) },
      fechaAplicacion,
      fechaSiguiente: new Date(new Date(fechaAplicacion).setFullYear(new Date(fechaAplicacion).getFullYear() + 1)).toISOString().split('T')[0],
      estado: 'Aplicada'
    };
    await petService.addVacuna(id, payload, pet.nombre);
    
    // Generar cargo clínico de vacunación pendiente para caja (Precio estándar S/. 45.00)
    const vacName = selectedVac?.nombre || 'Vacuna';
    addPendingCharge(id, pet.nombre, pet.cliente?.nombre || 'Cliente', 'Vacuna', `Vacunación: ${vacName}`, 45.00);

    setShowVacunaModal(false);
    loadPetData();
    setActiveTab('Vacunas');
  };

  const handleCreateDocumento = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const file = selectedFile;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      const payload = {
        nombre: file.name,
        tamaño: file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(file.size / 1024).toFixed(0)} KB`,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: docDesc || 'Archivo subido por el usuario',
        fileData: base64Data
      };

      const savedDoc = await petService.addDocumento(id, payload);
      setDocumentos([savedDoc, ...documentos]);
      setSelectedFile(null);
      setDocDesc('');
      setShowDocUploadForm(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocumento = async (docId) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      await petService.deleteDocumento(docId);
      setDocumentos(documentos.filter(d => d.id !== docId));
    }
  };

  const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      document.head.appendChild(script);
    });
  };

  const handleDownloadDocumento = async (doc) => {
    if (doc.nombre.toLowerCase().endsWith('.pdf') && doc.fileData) {
      const html2pdf = await loadHtml2Pdf();
      
      let htmlContent = '';
      if (doc.fileData.includes('base64,')) {
        htmlContent = decodeURIComponent(escape(atob(doc.fileData.split('base64,')[1])));
      } else {
        htmlContent = doc.fileData;
      }

      // Inyectar anulaciones de estilos CSS para que los textos sean negro puro en PDFs antiguos
      const cssOverride = `
        <style>
          body, td, span, strong, div, p, table, th { color: #000000 !important; }
          .value { color: #000000 !important; font-weight: bold !important; }
          .document-container { max-width: none !important; margin: 0 !important; border: 3px double #0f766e !important; min-height: 980px !important; }
          .clinic-logo, .cert-title, .table-title, .signature-name { color: #0f766e !important; }
        </style>
      `;
      htmlContent = htmlContent.replace('</head>', `${cssOverride}</head>`);

      // Pasar el string HTML directamente a html2pdf para renderizado en iframe interno
      const opt = {
        margin:       [0.4, 0.4],
        filename:     doc.nombre,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      try {
        await html2pdf().from(htmlContent).set(opt).save();
      } catch (err) {
        console.error("Error al generar PDF:", err);
      }
    } else if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getSystemConfig = () => {
    let loggedUser = null;
    try {
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) loggedUser = JSON.parse(savedUser);
    } catch (e) {}

    const defaults = {
      empresaNombre: 'PET PLACE',
      empresaSubtitulo: 'SERVICIOS MÉDICOS VETERINARIOS',
      empresaDireccion: 'Av. Benavides 1240, Miraflores, Lima',
      empresaTelefono: '(01) 445-8930',
      empresaEmail: 'contacto@petsplace.pe',
      empresaRuc: '20608932451',
      vetNombre: loggedUser?.nombre || 'Veterinario Registrado',
      vetEspecialidad: 'MÉDICO VETERINARIO REGISTRADO',
      vetCmvp: 'C.M.V.P. 8412'
    };
    const saved = localStorage.getItem('petplace_system_config');
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  };

  const generateCertificadoSalud = async () => {
    if (!pet) return;
    const config = getSystemConfig();
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado Médico de Salud Veterinaria - ${pet.nombre}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #1e293b; line-height: 1.4; padding: 0; margin: 0; background: white; }
    .document-container { border: 3px double #0f766e; padding: 45px; border-radius: 12px; min-height: 980px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .clinic-info { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
    .clinic-logo { font-size: 24px; font-weight: bold; color: #0f766e; margin: 0; font-family: sans-serif; }
    .clinic-text { font-size: 9.5px; color: #475569; text-align: right; font-family: sans-serif; line-height: 1.4; }
    .cert-title { text-align: center; font-size: 20px; font-weight: bold; color: #0f766e; margin: 25px 0; text-transform: uppercase; letter-spacing: 1px; }
    .declaration-para { font-size: 13.5px; text-align: justify; margin-bottom: 25px; text-indent: 40px; line-height: 1.7; }
    .table-title { font-size: 12px; font-weight: bold; color: #0f766e; margin-bottom: 8px; font-family: sans-serif; text-transform: uppercase; }
    
    .data-grid { border: 1.5px solid #0f766e; border-radius: 8px; margin-bottom: 25px; overflow: hidden; background: #fdfefe; font-family: sans-serif; }
    .data-row { border-bottom: 1.5px solid #0f766e; font-size: 0; }
    .data-row:last-child { border-bottom: none; }
    .data-cell { display: inline-block; width: 50%; box-sizing: border-box; padding: 11px 15px; border-right: 1.5px solid #0f766e; font-size: 11.5px; vertical-align: middle; }
    .data-cell:last-child { border-right: none; }
    .label { font-weight: bold; color: #0f766e; display: inline-block; width: 110px; vertical-align: middle; }
    .value { display: inline-block; width: calc(100% - 115px); vertical-align: middle; color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important; }

    .sign-section { margin-top: 35px; display: flex; justify-content: center; align-items: center; flex-direction: column; }
    .signature-line { width: 220px; border-top: 1.5px solid #475569; margin-bottom: 8px; }
    .signature-name { font-size: 12px; font-weight: bold; color: #0f766e; font-family: sans-serif; }
    .signature-cmvp { font-size: 9.5px; color: #64748b; font-family: sans-serif; }
    .doc-footer { margin-top: 25px; text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; font-family: sans-serif; }
  </style>
</head>
<body>
  <div class="document-container">
    <div>
      <div class="clinic-info">
        <div>
          <h1 class="clinic-logo">${config.empresaNombre}</h1>
          <span style="font-size: 10px; color: #0d9488; font-family: sans-serif; font-weight: bold;">${config.empresaSubtitulo}</span>
        </div>
        <div class="clinic-text">
          ${config.empresaDireccion}<br>
          Telf: ${config.empresaTelefono} | Correo: ${config.empresaEmail}<br>
          R.U.C. ${config.empresaRuc}
        </div>
      </div>

      <h2 class="cert-title">Certificado Médico de Salud Veterinaria</h2>

      <p class="declaration-para">
        El profesional Médico Veterinario que suscribe, debidamente colegiado y habilitado por el Colegio Médico Veterinario del Perú (C.M.V.P.), certifica bajo juramento que ha examinado minuciosamente al paciente que se detalla a continuación. Tras las evaluaciones físicas generales correspondientes, se constata que presenta un estado orgánico normal, no mostrando signos clínicos de enfermedades infectocontagiosas ni parasitarias vigentes al momento de la expedición de este documento.
      </p>

      <h3 class="table-title">Datos del Paciente Examinado</h3>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-cell">
            <span class="label">Mascota:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${pet.nombre}</span>
          </div>
          <div class="data-cell">
            <span class="label">Especie / Raza:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${pet.especie} / ${pet.raza || 'Común'}</span>
          </div>
        </div>
        <div class="data-row">
          <div class="data-cell">
            <span class="label">Sexo / Edad:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${pet.sexo || 'Macho'} / ${pet.edad || '0'} años</span>
          </div>
          <div class="data-cell">
            <span class="label">Color Manto:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${pet.color || 'No especificado'}</span>
          </div>
        </div>
        <div class="data-row">
          <div class="data-cell">
            <span class="label">Peso Evaluado:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${evolucionLogs.length > 0 ? evolucionLogs[0].peso : (pet.peso || '--')} kg</span>
          </div>
          <div class="data-cell">
            <span class="label">Propietario:</span>
            <span class="value" style="color: #000000 !important; font-weight: bold !important; font-size: 13.5px !important;">${pet.cliente?.nombre || 'No registrado'}</span>
          </div>
        </div>
      </div>

      <p class="declaration-para" style="margin-bottom: 20px;">
        Se expide el presente certificado a solicitud del propietario para los fines de traslado, control sanitario o requerimiento administrativo que estime conveniente.
      </p>
    </div>

    <div>
      <div class="sign-section">
        <div class="signature-line"></div>
        <span class="signature-name">${config.vetNombre}</span>
        <span class="signature-cmvp">${config.vetEspecialidad} - ${config.vetCmvp}</span>
      </div>

      <div class="doc-footer">
        Documento Oficial de Certificación Veterinaria · Generado el ${new Date().toLocaleDateString('es-ES')}
      </div>
    </div>
  </div>
</body>
</html>`;

    const base64Content = 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(htmlContent)));
    const payload = {
      nombre: `Certificado_Salud_${pet.nombre}.pdf`,
      tamaño: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: 'Certificado de salud clínica oficial (.pdf)',
      fileData: base64Content
    };

    const savedDoc = await petService.addDocumento(id, payload);
    setDocumentos([savedDoc, ...documentos]);
  };

  const generateCarnetVacunas = async () => {
    if (!pet) return;
    const config = getSystemConfig();
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Oficial de Inmunización - ${pet.nombre}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.4; padding: 0; margin: 0; background: white; }
    .document-container { border: 3px double #0f766e; padding: 45px; border-radius: 12px; min-height: 980px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .clinic-info { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
    .clinic-logo { font-size: 24px; font-weight: bold; color: #0f766e; margin: 0; }
    .clinic-text { font-size: 9.5px; color: #475569; text-align: right; line-height: 1.4; }
    .doc-title { text-align: center; font-size: 20px; font-weight: bold; color: #0f766e; margin: 25px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .pet-info-box { background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 11px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
    th { background: #f8fafc; color: #0f766e; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; text-align: left; text-transform: uppercase; }
    td { padding: 10px; border: 1px solid #cbd5e1; color: #334155; }
    .status-badge { font-weight: bold; padding: 3px 8px; border-radius: 8px; font-size: 9px; text-transform: uppercase; display: inline-block; }
    .status-applied { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-pending { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .doc-footer { margin-top: 25px; text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="document-container">
    <div>
      <div class="clinic-info">
        <div>
          <h1 class="clinic-logo">${config.empresaNombre}</h1>
          <span style="font-size: 10px; color: #0d9488; font-weight: bold;">${config.empresaSubtitulo}</span>
        </div>
        <div class="clinic-text">
          ${config.empresaDireccion}<br>
          Telf: ${config.empresaTelefono} | Correo: ${config.empresaEmail}<br>
          R.U.C. ${config.empresaRuc}
        </div>
      </div>

      <h2 class="doc-title">Ficha Oficial de Inmunización</h2>
      
      <div class="pet-info-box">
        <span><strong>Mascota:</strong> <span style="color: #000000 !important; font-weight: bold !important;">${pet.nombre}</span> (${pet.especie})</span>
        <span><strong>Propietario:</strong> <span style="color: #000000 !important; font-weight: bold !important;">${pet.cliente?.nombre || 'No registrado'}</span></span>
        <span><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</span>
      </div>

      <p style="font-size: 12px; color: #475569; margin-bottom: 15px; text-align: justify; line-height: 1.6;">
        A continuación se listan las vacunas aplicadas al paciente en esta clínica veterinaria, incluyendo las fechas correspondientes de inoculación y refuerzos anuales programados para el control preventivo epidemiológico.
      </p>

      <table>
        <thead>
          <tr>
            <th>Vacuna Catalogo</th>
            <th>Fecha Inoculación</th>
            <th>Siguiente Refuerzo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${vacunas.length === 0 ? `
            <tr>
              <td colspan="4" style="text-align: center; color: #94a3b8; padding: 25px;">No se registran vacunas aplicadas en el historial de este paciente.</td>
            </tr>
          ` : vacunas.map(v => `
            <tr>
              <td><strong>${v.vacuna?.nombre || 'Vacuna'}</strong></td>
              <td>${v.fechaAplicacion.split('-').reverse().join('/')}</td>
              <td>${v.fechaSiguiente ? v.fechaSiguiente.split('-').reverse().join('/') : '--'}</td>
              <td><span class="status-badge ${v.estado === 'Aplicada' ? 'status-applied' : 'status-pending'}">${v.estado}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      Carnet de Inmunización · ${config.empresaNombre}
    </div>
  </div>
</body>
</html>`;

    const base64Content = 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(htmlContent)));
    const payload = {
      nombre: `Carnet_Vacunacion_${pet.nombre}.pdf`,
      tamaño: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: 'Carnet oficial de vacunas (.pdf)',
      fileData: base64Content
    };

    const savedDoc = await petService.addDocumento(id, payload);
    setDocumentos([savedDoc, ...documentos]);
  };

  const generateHistorialConsultas = async () => {
    if (!pet) return;
    const config = getSystemConfig();
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Expediente Historial de Consultas - ${pet.nombre}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.4; padding: 0; margin: 0; background: white; }
    .document-container { border: 3px double #0f766e; padding: 45px; border-radius: 12px; min-height: 980px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
    .clinic-info { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
    .clinic-logo { font-size: 24px; font-weight: bold; color: #0f766e; margin: 0; }
    .clinic-text { font-size: 9.5px; color: #475569; text-align: right; line-height: 1.4; }
    .doc-title { text-align: center; font-size: 20px; font-weight: bold; color: #0f766e; margin: 25px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .pet-info-box { background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 11px; display: flex; justify-content: space-between; }
    .consultation-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 15px; margin-bottom: 15px; background: #f8fafc; }
    .consultation-header { display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 10px; font-size: 11.5px; font-weight: bold; color: #0f766e; }
    .info-row { font-size: 11px; margin-bottom: 6px; line-height: 1.4; color: #000000 !important; }
    .label { font-weight: bold; color: #475569; display: inline-block; width: 140px; vertical-align: top; }
    .value { display: inline-block; width: calc(100% - 145px); vertical-align: top; color: #000000 !important; }
    .doc-footer { margin-top: 25px; text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="document-container">
    <div>
      <div class="clinic-info">
        <div>
          <h1 class="clinic-logo">${config.empresaNombre}</h1>
          <span style="font-size: 10px; color: #0d9488; font-family: sans-serif; font-weight: bold;">${config.empresaSubtitulo}</span>
        </div>
        <div class="clinic-text">
          ${config.empresaDireccion}<br>
          Telf: ${config.empresaTelefono} | Correo: ${config.empresaEmail}<br>
          R.U.C. ${config.empresaRuc}
        </div>
      </div>

      <h2 class="doc-title">Historial Completo de Consultas Clínicas</h2>
      
      <div class="pet-info-box">
        <span><strong>Mascota:</strong> <span style="color: #000000 !important; font-weight: bold !important;">${pet.nombre}</span> (${pet.especie})</span>
        <span><strong>Propietario:</strong> <span style="color: #000000 !important; font-weight: bold !important;">${pet.cliente?.nombre || 'No registrado'}</span></span>
        <span><strong>Fecha Reporte:</strong> ${new Date().toLocaleDateString('es-ES')}</span>
      </div>

      ${consultas.length === 0 ? `
        <p style="text-align: center; color: #94a3b8; font-size: 12px; padding: 30px 0;">No se registran visitas clínicas registradas en el historial del paciente.</p>
      ` : consultas.map(c => `
        <div class="consultation-card">
          <div class="consultation-header">
            <span>🩺 CONSULTA CLÍNICA GENERAL</span>
            <span>${new Date(c.fecha).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="info-row"><span class="label">Motivo:</span> <span class="value">${c.motivo}</span></div>
          <div class="info-row"><span class="label">Diagnóstico:</span> <span class="value">${c.diagnostico}</span></div>
          ${c.tratamiento ? `<div class="info-row"><span class="label">Tratamiento:</span> <span class="value">${c.tratamiento}</span></div>` : ''}
          ${c.medicamentos ? `<div class="info-row"><span class="label">Medicamentos:</span> <span class="value">${c.medicamentos}</span></div>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="doc-footer">
      Historial Clínico de Consultas · ${config.empresaNombre}
    </div>
  </div>
</body>
</html>`;

    const base64Content = 'data:text/html;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(htmlContent)));
    const payload = {
      nombre: `Historial_Consultas_${pet.nombre}.pdf`,
      tamaño: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: 'Resumen completo de visitas clínicas (.pdf)',
      fileData: base64Content
    };

    const savedDoc = await petService.addDocumento(id, payload);
    setDocumentos([savedDoc, ...documentos]);
  };

  const handleCreateEvolucion = async (e) => {
    e.preventDefault();
    if (!evolPeso) return;
    const payload = {
      fecha: evolFecha,
      peso: Number(evolPeso),
      temperatura: evolTemp ? `${Number(evolTemp)} °C` : '--',
      notas: evolNotas || 'Control de evolución rutinario'
    };
    await petService.addEvolucion(id, payload);
    setEvolPeso('');
    setEvolTemp('');
    setEvolNotas('');
    // Recargar el perfil completo para actualizar el peso y refrescar la lista de evolución
    loadPetData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] select-none">
        <span className="button is-loading is-large is-ghost border-none">Cargando perfil...</span>
      </div>
    );
  }

  // Obtener alertas separando por comas o guiones
  const getAlerts = () => {
    const list = [];
    if (pet.alergias && pet.alergias.toLowerCase() !== 'ninguna') {
      list.push({ type: 'Alergia', text: `Alergia: ${pet.alergias}` });
    }
    if (pet.notasClinicas) {
      const split = pet.notasClinicas.split('-');
      split.forEach(s => {
        if (s.trim()) {
          list.push({ type: 'Nota', text: s.trim() });
        }
      });
    }
    return list;
  };

  const alertList = getAlerts();

  return (
    <div className="space-y-6 select-none text-xs">
      
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/mascotas')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-bold"
        >
          <FiArrowLeft />
          <span>Volver al listado</span>
        </button>
      </div>

      {pet.alergias && pet.alergias.toLowerCase() !== 'ninguna' && pet.alergias.toLowerCase() !== 'ninguno' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 animate-pulse shadow-sm">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-rose-900">¡Alerta Médica de Alergia!</h4>
            <p className="text-[11px] font-semibold text-rose-650 mt-0.5">El paciente presenta sensibilidad/alergia registrada: <strong className="text-rose-800 font-black">{pet.alergias}</strong>. Tomar extremas precauciones antes de recetar o administrar medicamentos.</p>
          </div>
        </div>
      )}

      {totalPending > 0 && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-950">Cobros Clínicos Pendientes en Caja</h4>
              <p className="text-[11px] font-semibold text-emerald-650 mt-0.5">Esta mascota tiene un total de <strong className="text-emerald-800 font-black">S/. {totalPending.toFixed(2)}</strong> acumulados en cargos pendientes de cobro.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/nueva-venta', { state: { selectedPetId: id } })}
            className="flex items-center gap-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold h-8 px-4 rounded-xl shadow-md shadow-emerald-500/10 transition-all border-0 cursor-pointer active:scale-95"
          >
            <span>Ir a Caja (Cobrar)</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD (1 columna) */}
        <div className="space-y-4">
          
          {/* Card Principal de Mascota */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-5">
            
            {/* Foto, Nombre, Código */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl border border-slate-100 shadow-inner select-none">
                {pet.emoji || '🐶'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{pet.nombre}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">PET-00{pet.id}</p>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-50 text-cyan-500 uppercase">
                  {pet.especie}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-500 uppercase">
                  {pet.sexo || 'Macho'}
                </span>
              </div>
            </div>

            {/* DATOS */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Datos Fisiológicos</h4>
              <div className="grid grid-cols-2 gap-3 text-slate-600 font-semibold">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">Edad</span>
                  <span className="text-slate-800">{pet.edad || '0'} años</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">Peso</span>
                  <span className="text-slate-800">
                    {evolucionLogs.length > 0 ? evolucionLogs[0].peso : (pet.peso || '0')} kg
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">Raza</span>
                  <span className="text-slate-800 truncate block">{pet.raza || 'Común'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">Color</span>
                  <span className="text-slate-800 truncate block">{pet.color || 'Sin color'}</span>
                </div>
              </div>
            </div>

            {/* ALERTAS */}
            {alertList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alertas Médicas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {alertList.map((alert, idx) => (
                    <span 
                      key={idx} 
                      className={`px-3 py-1 rounded-xl text-[10px] font-extrabold border ${
                        alert.type === 'Alergia' 
                          ? 'bg-rose-50 border-rose-100 text-rose-500' 
                          : 'bg-amber-50 border-amber-100 text-amber-500'
                      }`}
                    >
                      ⚠️ {alert.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PROPIETARIO */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Propietario</h4>
              <div className="space-y-2 font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">👤</span>
                  <div>
                    <span className="text-slate-800 block text-xs">{pet.cliente?.nombre || 'Particular'}</span>
                    <span className="text-[9px] text-slate-400 block font-bold mt-0.5">DNI: {pet.cliente?.dni || '--'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone className="text-slate-400 w-4 h-4 ml-1.5" />
                  <span className="text-xs">{pet.cliente?.telefono || '--'}</span>
                </div>
                {pet.cliente?.email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="text-slate-400 w-4 h-4 ml-1.5" />
                    <span className="text-xs truncate">{pet.cliente.email}</span>
                  </div>
                )}
                {pet.cliente?.direccion && (
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-slate-400 w-4 h-4 ml-1.5" />
                    <span className="text-xs truncate">{pet.cliente.direccion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES RÁPIDOS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setShowConsultaModal(true)}
                className="h-9 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/20 text-slate-700 font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>🩺 Consulta</span>
              </button>
              <button 
                onClick={() => setShowVacunaModal(true)}
                className="h-9 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/20 text-slate-700 font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>💉 Vacuna</span>
              </button>
            </div>

          </div>

        </div>

        {/* COLUMNA DERECHA: PESTAÑAS Y FICHA CLÍNICA (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Menu de Pestañas */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
            {rightTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center rounded-lg font-bold text-[10px] transition-all duration-150 ${
                  activeTab === tab 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* CONTENEDOR DINÁMICO */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[300px]">
            
            {/* PESTAÑA: RESUMEN */}
            {activeTab === 'Resumen' && (
              <div className="space-y-6">
                
                {/* Cuadrícula de Métricas Clínicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Última Consulta</span>
                    <span className="text-slate-800 font-bold text-xs mt-1 block">
                      {consultas.length > 0 ? consultas[0].fecha.split('T')[0].split('-').reverse().join('/') : '--'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block truncate">
                      {consultas.length > 0 ? consultas[0].motivo : 'Sin historial'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Próxima Cita</span>
                    <span className="text-slate-800 font-bold text-xs mt-1 block">--</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Sin citas programadas</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Vacuna Pendiente</span>
                    <span className="text-rose-500 font-bold text-xs mt-1 block">Polivalente DHPP</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">23/04/2026</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Peso Actual</span>
                    <span className="text-slate-800 font-bold text-xs mt-1 block">{pet.peso || '0'} kg</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Previo: 27.5kg</span>
                  </div>
                </div>

                {/* Ficha Última Consulta */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-slate-800">📄 Detalles de Última Consulta</h4>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {consultas.length > 0 ? (
                        <>
                          {new Date(consultas[0].fecha).toLocaleDateString('es-ES')} · {consultas[0].veterinario || 'Veterinario Registrado'}
                        </>
                      ) : (
                        'Sin consultas'
                      )}
                    </span>
                  </div>
                  {consultas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Diagnóstico</span>
                        <p className="text-slate-700 font-semibold mt-1">{consultas[0].diagnostico || 'Control de rutina'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Tratamiento</span>
                        <p className="text-slate-700 font-semibold mt-1">{consultas[0].tratamiento || 'Ninguno'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Medicamentos Recetados</span>
                        <p className="text-slate-700 font-semibold mt-1">{consultas[0].medicamentos || 'Ninguno'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-4">No se han registrado consultas médicas para esta mascota.</p>
                  )}
                </div>

              </div>
            )}

            {/* PESTAÑA: CONSULTAS */}
            {activeTab === 'Consultas' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Historial Clínico ({consultas.length})</h4>
                  <button 
                    onClick={() => setShowConsultaModal(true)}
                    className="flex items-center justify-center gap-2 !bg-cyan-500 hover:!bg-cyan-600 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-md shadow-cyan-500/10 transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
                  >
                    <FiPlus className="w-4.5 h-4.5" />
                    <span>Nueva Consulta</span>
                  </button>
                </div>

                {consultas.length === 0 ? (
                  <p className="text-slate-400 text-center py-10">Sin consultas registradas.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-6 ml-2 space-y-6 py-2">
                    {consultas.map((c, i) => (
                      <div key={c.id} className="relative">
                        <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-4 border-white shadow-sm" />
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">Motivo: {c.motivo}</span>
                              <span className="text-[9.5px] text-[#0d9488] font-bold mt-0.5">🩺 Vet: {c.veterinario || 'Veterinario Registrado'}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {c.fecha.includes('T') ? c.fecha.split('T')[0].split('-').reverse().join('/') : c.fecha}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 font-semibold">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Diagnóstico</span>
                              <span className="text-slate-800">{c.diagnostico}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Tratamiento</span>
                              <span className="text-slate-800">{c.tratamiento}</span>
                            </div>
                            {c.medicamentos && (
                              <div className="md:col-span-2">
                                <span className="text-[9px] text-slate-400 block font-bold">Medicamentos</span>
                                <span className="text-slate-800">{c.medicamentos}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA: VACUNAS */}
            {activeTab === 'Vacunas' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Plan de Vacunación ({vacunas.length})</h4>
                  <button 
                    onClick={() => setShowVacunaModal(true)}
                    className="flex items-center justify-center gap-2 !bg-cyan-500 hover:!bg-cyan-600 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-md shadow-cyan-500/10 transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
                  >
                    <FiPlus className="w-4.5 h-4.5" />
                    <span>Aplicar Vacuna</span>
                  </button>
                </div>

                {vacunas.length === 0 ? (
                  <p className="text-slate-400 text-center py-10">No se han registrado vacunas aplicadas.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="p-3">Vacuna</th>
                          <th className="p-3">Fecha Aplicación</th>
                          <th className="p-3">Fecha Refuerzo</th>
                          <th className="p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                        {vacunas.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/20">
                            <td className="p-3 font-bold text-slate-800">{v.vacuna?.nombre || 'Vacuna'}</td>
                            <td className="p-3">{v.fechaAplicacion.split('-').reverse().join('/')}</td>
                            <td className="p-3">{v.fechaSiguiente ? v.fechaSiguiente.split('-').reverse().join('/') : '--'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                v.estado === 'Aplicada' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                              }`}>
                                {v.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA: DOCUMENTOS */}
            {activeTab === 'Documentos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Expedientes y Documentos ({documentos.length})</h4>
                  <button 
                    onClick={() => setShowDocUploadForm(!showDocUploadForm)}
                    className="flex items-center gap-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-bold h-7 px-3 rounded-lg shadow-sm transition-all border-0"
                  >
                    <FiUpload />
                    <span>Subir Documento</span>
                  </button>
                </div>

                {/* Generador Clínico de Documentos */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 select-none">
                      <span>✨</span> Generador Clínico de Documentos
                    </h5>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Genera y guarda en Supabase certificados oficiales basados en el estado actual de la mascota</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={generateCertificadoSalud}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/10 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-[10px] select-none shadow-sm active:scale-95 border-0"
                    >
                      <span className="text-sm">📜</span>
                      <span>Certificado de Salud</span>
                    </button>
                    <button
                      onClick={generateCarnetVacunas}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/10 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-[10px] select-none shadow-sm active:scale-95 border-0"
                    >
                      <span className="text-sm">💉</span>
                      <span>Carnet de Vacunas</span>
                    </button>
                    <button
                      onClick={generateHistorialConsultas}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/10 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-[10px] select-none shadow-sm active:scale-95 border-0"
                    >
                      <span className="text-sm">🩺</span>
                      <span>Historial Clínico</span>
                    </button>
                  </div>
                </div>

                {/* Formulario de Subida inline */}
                {showDocUploadForm && (
                  <form onSubmit={handleCreateDocumento} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-in fade-in-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-600 text-[10px]">Seleccionar Archivo (PDF, Imagen, etc.)</label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 h-8 border border-slate-200 rounded-lg px-2 focus:outline-none text-slate-500 font-semibold bg-white flex items-center"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-600 text-[10px]">Descripción / Observación</label>
                        <input
                          type="text"
                          value={docDesc}
                          onChange={(e) => setDocDesc(e.target.value)}
                          placeholder="Ej. Resultados de análisis"
                          className="h-8 border border-slate-200 rounded-lg px-3 focus:outline-none focus:border-cyan-400 text-slate-700 font-semibold bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDocUploadForm(false);
                          setSelectedFile(null);
                        }}
                        className="h-7 px-3 border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="h-7 px-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-lg font-bold text-[10px] border-0"
                      >
                        Confirmar Subida
                      </button>
                    </div>
                  </form>
                )}

                {/* Listado de Documentos */}
                {documentos.length === 0 ? (
                  <p className="text-slate-400 text-center py-10">No hay documentos adjuntos.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {documentos.map((doc) => (
                      <div key={doc.id} className="p-3.5 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center justify-between transition-all shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl p-2 bg-slate-50 border border-slate-100 rounded-xl select-none">📄</span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 text-xs block truncate">{doc.nombre}</span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                              {doc.descripcion} · {doc.fecha.split('-').reverse().join('/')} · {doc.tamaño}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadDocumento(doc)}
                            className="p-2 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-50/50 transition-colors border-0 bg-transparent cursor-pointer"
                            title="Descargar archivo"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocumento(doc.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors border-0 bg-transparent cursor-pointer"
                            title="Eliminar archivo"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA: EVOLUCIÓN */}
            {activeTab === 'Evolución' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Evolución Clínica del Paciente</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-50 text-cyan-500 uppercase flex items-center gap-1 select-none">
                    <FiActivity /> Peso Óptimo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Formulario registrar evolución (1 Columna) */}
                  <form onSubmit={handleCreateEvolucion} className="bg-slate-50/55 border border-slate-100 rounded-xl p-4 space-y-3.5 text-[11px] h-fit md:col-span-1">
                    <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-2">➕ Registrar Evolución</h5>
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-650">Fecha</label>
                      <input
                        type="date"
                        value={evolFecha}
                        onChange={(e) => setEvolFecha(e.target.value)}
                        className="h-8 border border-slate-200 rounded-lg px-2 bg-white text-slate-700 font-semibold focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-655">Peso (KG)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={evolPeso}
                          onChange={(e) => setEvolPeso(e.target.value)}
                          placeholder="Ej. 28.5"
                          className="h-8 border border-slate-200 rounded-lg px-2 bg-white text-slate-700 font-semibold focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-slate-655">Temp. (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={evolTemp}
                          onChange={(e) => setEvolTemp(e.target.value)}
                          placeholder="Ej. 38.6"
                          className="h-8 border border-slate-200 rounded-lg px-2 bg-white text-slate-700 font-semibold focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-655">Observaciones</label>
                      <textarea
                        value={evolNotas}
                        onChange={(e) => setEvolNotas(e.target.value)}
                        placeholder="Ej. Estado óptimo, herida cicatrizada."
                        className="h-16 border border-slate-200 rounded-lg p-2.5 bg-white resize-none text-slate-700 font-semibold focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-8 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-lg font-bold transition-all shadow-sm text-[10px] border-0"
                    >
                      Añadir Medición
                    </button>
                  </form>

                  {/* Historial en línea de tiempo (2 Columnas) */}
                  <div className="md:col-span-2 space-y-4">
                    <h5 className="font-bold text-slate-750">Historial Clínico de Mediciones</h5>
                    
                    {evolucionLogs.length === 0 ? (
                      <p className="text-slate-400 text-center py-10">Sin registros clínicos.</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-100 pl-5 ml-2 space-y-5 py-1">
                        {evolucionLogs.map((log) => (
                          <div key={log.id} className="relative">
                            <span className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 border-2 border-white shadow-sm" />
                            <div className="bg-slate-50/40 hover:bg-slate-50/80 border border-slate-150 rounded-xl p-3.5 space-y-2 transition-all">
                              <div className="flex justify-between items-center select-none">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                                    ⚖️ {log.peso} kg
                                  </span>
                                  {log.temperatura && (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                      🌡️ {log.temperatura}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-450 font-bold">
                                  {log.fecha.split('-').reverse().join('/')}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                {log.notes || log.notas}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showConsultaModal && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">🩺 Registrar Nueva Consulta</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Registra el diagnóstico, tratamiento y costos del paciente.</p>
                </div>
                <button 
                  onClick={() => setShowConsultaModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateConsulta} className="py-8 space-y-6 text-xs">
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Motivo de Consulta</label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. Chequeo mensual, cojera de patita"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Diagnóstico Clínico</label>
                  <textarea
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    placeholder="Escribe el diagnóstico clínico completo..."
                    className="h-24 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Tratamiento Sugerido</label>
                  <textarea
                    value={tratamiento}
                    onChange={(e) => setTratamiento(e.target.value)}
                    placeholder="Ej. Reposo absoluto, curación de herida cada 24h"
                    className="h-24 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Medicamentos y Dosis</label>
                  <input
                    type="text"
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    placeholder="Ej. Meloxicam 7.5mg, 1 tableta cada 24h"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Veterinario Tratante</label>
                  <select
                    value={veterinario}
                    onChange={(e) => setVeterinario(e.target.value)}
                    className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                  >
                    {veterinarios.length === 0 ? (
                      <>
                        <option value="Dr. Torres">Dr. Torres</option>
                        <option value="Dra. Gomez">Dra. Gomez</option>
                      </>
                    ) : (
                      veterinarios.map(v => (
                        <option key={v.id} value={v.nombre}>{v.nombre}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Costo del Servicio (S/.)</label>
                  <input
                    type="number"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-black text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowConsultaModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer"
                  >
                    Guardar Consulta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR VACUNA */}
      {showVacunaModal && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">💉 Aplicar Vacuna</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Registra la aplicación de vacunas al historial de inmunización de la mascota.</p>
                </div>
                <button 
                  onClick={() => setShowVacunaModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVacuna} className="py-8 space-y-6 text-xs">
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Seleccionar Vacuna</label>
                  <select
                    value={vacunaId}
                    onChange={(e) => setVacunaId(e.target.value)}
                    className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                    required
                  >
                    {vacunasCatalogo.length === 0 ? (
                      <option value="">No hay vacunas en el catálogo. Registra una primero.</option>
                    ) : (
                      vacunasCatalogo.map(v => (
                        <option key={v.id} value={v.id}>{v.nombre} ({v.especieDestino})</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Fecha Aplicación</label>
                  <input
                    type="date"
                    value={fechaAplicacion}
                    onChange={(e) => setFechaAplicacion(e.target.value)}
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowVacunaModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer"
                  >
                    Confirmar Aplicación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
