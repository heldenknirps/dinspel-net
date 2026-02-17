document.addEventListener('DOMContentLoaded', () => {

    const OCSP_SIZE = 500; 
    const SCT_SIZE = 200;  

    function parseCSVtoObjects(csvText) {
        if (!csvText) return [];
        const lines = csvText.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            if (currentLine.length > 0) {
                const obj = {};
                headers.forEach((header, index) => {
                    let val = currentLine[index] ? currentLine[index].trim() : "";
                    val = val.replace(/^"|"$/g, '');
                    obj[header] = val; 
                });
                data.push(obj);
            }
        }
        return data;
    }

    // Source data
    const pkeDataSchemes = parseCSVtoObjects(rawPKIschemes);
    const pkeDataParams = parseCSVtoObjects(rawPKIparams);
    const schemesData = parseCSVtoObjects(rawSchemes);
    const paramsData = parseCSVtoObjects(rawParams);

    // Key-exchange 1
    const keyExScheme1 = document.getElementById('keyExScheme1');
    const listKeyExScheme1 = document.getElementById('listKeyExScheme1');
    const keyExParams1 = document.getElementById('keyExParams1');
    const listKeyExParams1 = document.getElementById('listKeyExParams1');
    const keyEx1 = document.getElementById('keyEx1')

    // Hybrid enabled?
    const checkHybrid = document.getElementById('checkHybrid');
    const hybridInputs = document.getElementById('hybrid-inputs');

    // Key-exchange 2
    const keyExScheme2 = document.getElementById('keyExScheme2');
    const listKeyExScheme2 = document.getElementById('listKeyExScheme2');
    const keyExParams2 = document.getElementById('keyExParams2');
    const listKeyExParams2 = document.getElementById('listKeyExParams2');

    // Signature
    const sigScheme = document.getElementById('sigScheme');
    const listSigSchemes = document.getElementById('listSigSchemes');
    const sigParams = document.getElementById('sigParams');
    const listSigParams = document.getElementById('listSigParams');

    // OCSP-Stapling
    const checkOCSP = document.getElementById('checkOCSP');
    const ocspSig = document.getElementById('ocsp-sig');
    const sigSchemeOCSP = document.getElementById('sigSchemeOcsp');
    const listSigSchemesOCSP = document.getElementById('listSigSchemesOcsp');
    const sigParamsOCSP = document.getElementById('sigParamsOcsp');
    const listSigParamsOCSP = document.getElementById('listSigParamsOcsp');

    // Certificate Transperancy
    const checkCT = document.getElementById('checkCT');
    const inputSctCount = document.getElementById('inputSctCount');
    const sctSig = document.getElementById('ct-sig');
    const sigSchemeCT = document.getElementById('sigSchemeCt');
    const listSigSchemesCT = document.getElementById('listSigSchemesCt');
    const sigParamsCT = document.getElementById('sigParamsCt');
    const listSigParamsCT = document.getElementById('listSigParamsCt');

    // Encrypted Client Hello
    const checkECH = document.getElementById('checkECH');

    // UI stuff
    const addBtn = document.getElementById('addBtn');
    const resultBox = document.getElementById('result-box');
    const emptyState = document.getElementById('empty-state');

    let configHistory = [];

    // hybrid interaction
    checkHybrid.addEventListener('change', () => {
        if (checkHybrid.checked) {
            hybridInputs.classList.remove('hidden');
            keyEx1.textContent = "Key Exchange 1"
            // const kemOnly = pkeDataSchemes.filter(d => d.kem == "1");
            // setupCustomDropdown(keyExScheme1, listKeyExScheme1, kemOnly, 'Scheme', (val) => updateListKeyEx1(val));
            setupCustomDropdown(keyExScheme1, listKeyExScheme1, pkeDataSchemes, 'Scheme', (val) => updateListKeyEx1(val));
            // const classicOnly = pkeDataSchemes.filter(d => d.kem == "0");
            // setupCustomDropdown(keyExScheme2, listKeyExScheme2, classicOnly, 'Scheme', (val) => updateListKeyEx2(val));
            setupCustomDropdown(keyExScheme2, listKeyExScheme2, pkeDataSchemes, 'Scheme', (val) => updateListKeyEx2(val));
        } else {
            hybridInputs.classList.add('hidden');
            keyEx1.textContent = "Key Exchange"
            setupCustomDropdown(keyExScheme1, listKeyExScheme1, pkeDataSchemes, 'Scheme', (val) => updateListKeyEx1(val));
        }
    });

    // Fill dropdowns
    function setupCustomDropdown(inputElement, listElement, dataArray, displayKey, onSelect) {
        function renderOptions(filterText = "") {
            listElement.innerHTML = "";
            const lowerFilter = filterText.toLowerCase();
            const filtered = dataArray.filter(item => (item[displayKey] || "").toLowerCase().includes(lowerFilter));
            filtered.forEach(item => {
                const text = item[displayKey];
                const div = document.createElement('div');
                div.className = 'dropdown-option';
                div.textContent = text;
                div.addEventListener('click', () => {
                    inputElement.value = text;
                    listElement.classList.remove('show');
                    if (onSelect) onSelect(text);
                });
                listElement.appendChild(div);
            });
        }
        inputElement.addEventListener('focus', () => { renderOptions(inputElement.value); listElement.classList.add('show'); });
        inputElement.addEventListener('input', () => { renderOptions(inputElement.value); listElement.classList.add('show'); });
        document.addEventListener('click', (e) => { if (!inputElement.contains(e.target) && !listElement.contains(e.target)) listElement.classList.remove('show'); });
    }

    // Load params for kEx 1
    function updateListKeyEx1(scheme) {
        keyExParams1.value = "";
        const filtered = pkeDataParams.filter(row => row.Scheme === scheme);
        keyExParams1.disabled = filtered.length === 0;
        setupCustomDropdown(keyExParams1, listKeyExParams1, filtered, 'Parameterset', null);
    }

    // Load params for kEx 2
    function updateListKeyEx2(scheme) {
        keyExParams2.value = "";
        const filtered = pkeDataParams.filter(row => row.Scheme === scheme);
        keyExParams2.disabled = filtered.length === 0;
        setupCustomDropdown(keyExParams2, listKeyExParams2, filtered, 'Parameterset', null);
    }

    // Load params for sig
    function updateListSig(scheme) {
        sigParams.value = "";
        const filtered = paramsData.filter(row => row.Scheme === scheme); 
        sigParams.disabled = filtered.length === 0;
        setupCustomDropdown(sigParams, listSigParams, filtered, 'Parameterset', null);
    }

     // Load params for OCSP sig
    function updateListSigOCSP(scheme) {
        sigParamsOCSP.value = "";
        const filtered = paramsData.filter(row => row.Scheme === scheme); 
        sigParamsOCSP.disabled = filtered.length === 0;
        setupCustomDropdown(sigParamsOCSP, listSigParamsOCSP, filtered, 'Parameterset', null);
    }

     // Load params for CT sig
    function updateListSigCT(scheme) {
        sigParamsCT.value = "";
        const filtered = paramsData.filter(row => row.Scheme === scheme); 
        sigParamsCT.disabled = filtered.length === 0;
        setupCustomDropdown(sigParamsCT, listSigParamsCT, filtered, 'Parameterset', null);
    }

    // Init kExScheme1 list
    setupCustomDropdown(keyExScheme1, listKeyExScheme1, pkeDataSchemes, 'Scheme', (val) => updateListKeyEx1(val));
    // Init sigScheme list
    setupCustomDropdown(sigScheme, listSigSchemes, schemesData, 'Scheme', (val) => updateListSig(val));

    checkOCSP.addEventListener('change', () => { 
        if (checkOCSP.checked) {  
            ocspSig.classList.remove('hidden');
            setupCustomDropdown(sigSchemeOCSP, listSigSchemesOCSP, schemesData, 'Scheme', (val) => updateListSigOCSP(val));
            sigSchemeOCSP.value = "ECDSA"; sigParamsOCSP.value = "secp256r1"; }
        else { ocspSig.classList.add('hidden'); sigSchemeOCSP.value = ""; sigParamsOCSP.value = ""; }
    });
    checkCT.addEventListener('change', () => { 
        if (checkCT.checked) { 
            sctSig.classList.remove('hidden'); inputSctCount.classList.remove('hidden'); 
            setupCustomDropdown(sigSchemeCT, listSigSchemesCT, schemesData, 'Scheme', (val) => updateListSigCT(val));
            sigSchemeCT.value = "ECDSA"; sigParamsCT.value = "secp256r1";  } 
        else { sctSig.classList.add('hidden'); inputSctCount.classList.add('hidden'); sigSchemeCT.value = ""; sigParamsCT.value = "";  }
    });

    addBtn.addEventListener('click', () => {
        const kExS1 = pkeDataSchemes.find(d => d.Scheme === keyExScheme1.value);
        const kExP1 = pkeDataParams.find(d => d.Parameterset === keyExParams1.value && d.Scheme === keyExScheme1.value);
        const isHybrid = checkHybrid.checked;
        const kExS2 = isHybrid ? pkeDataSchemes.find(d => d.Scheme === keyExScheme2.value) : null;
        const kExP2 = isHybrid ? pkeDataParams.find(d => d.Parameterset === keyExParams2.value && d.Scheme === keyExScheme2.value) : null;
        const sigS = schemesData.find(d => d.Scheme === sigScheme.value);
        const sigP = paramsData.find(d => d.Parameterset === sigParams.value && d.Scheme === sigScheme.value);

        const sigSCt = schemesData.find(d => d.Scheme === sigSchemeCT.value);
        const sigPCt = paramsData.find(d => d.Parameterset === sigParamsCT.value && d.Scheme === sigSchemeCT.value);
        
        const sigSOcsp = schemesData.find(d => d.Scheme === sigSchemeOCSP.value);
        const sigPOcsp = paramsData.find(d => d.Parameterset === sigParamsOCSP.value && d.Scheme === sigSchemeOCSP.value);


        if ((!kExS1 || !kExP1) && (!sigS || !sigP)) { alert("Finish config first!"); return; }
        if (isHybrid && (!kExS2 || !kExP2)) { alert("Finish both sets!"); return; }

        configHistory.push({
            id: Date.now(), 
            kExS1, kExP1,  
            sigS, sigP, 
            isHybrid, kExS2, kExP2,
            useOcsp: checkOCSP.checked, sigSOcsp, sigPOcsp,
            useSct: checkCT.checked, sctCount: parseInt(inputSctCount.value) || 2, sigSCt, sigPCt, 
            useEncPk: checkECH.checked
        });

        renderHistory();
        
        // Reset selection
        keyExScheme1.value = ""; keyExParams1.value = ""; 
        checkHybrid.checked = false; keyExScheme2.value = ""; keyExParams2.value = ""; hybridInputs.classList.add('hidden'); keyEx1.textContent = "Key Exchange";
        sigScheme.value = ""; sigParams.value = ""; 
        checkOCSP.checked = false; sigSchemeOCSP.value = ""; sigParamsOCSP.value = ""; ocspSig.classList.add('hidden');
        checkCT.checked = false;  sigSchemeCT.value = ""; sigParamsCT.value = ""; sctSig.classList.add('hidden'); inputSctCount.classList.add('hidden');
        checkECH.checked = false;
    });

    function renderHistory() {
        if (configHistory.length === 0) {
        resultBox.classList.add('hidden');
        emptyState.style.display = 'flex';
        const colLeft = document.getElementById('col-left');
        const colRight = document.getElementById('col-right');
        if (colLeft) colLeft.innerHTML = "";
        if (colRight) colRight.innerHTML = "";
        return; }



        emptyState.style.display = 'none';
        resultBox.classList.remove('hidden');

        const colLeft = document.getElementById('col-left');
        const colRight = document.getElementById('col-right');
        colLeft.innerHTML = ""; colRight.innerHTML = "";

        configHistory.forEach((set, index) => {
            const { kExS1, kExP1, kExS2, kExP2, sigS, sigP, isHybrid, useOcsp, useSct, sctCount, useEncPk, sigSOcsp, sigPOcsp, sigSCt, sigPCt} = set;

            // --- Calculations ---
            const pk1 = parseInt(kExP1?.pk) || 0;
            const pk2 = isHybrid ? (parseInt(kExP2?.pk) || 0) : 0;
            const clientHelloPKTotal = pk1 + pk2;
            const clientHelloTotal = useEncPk ? 2 * clientHelloPKTotal : clientHelloPKTotal;

            const res1 = kExP1 ? ((kExP1?.kem == '1') ? (parseInt(kExP1.ct) || 0) : (parseInt(kExP1.pk) || 0)) : 0;
            const res2 = isHybrid ? ((kExP2?.kem == '1') ? (parseInt(kExP2.ct) || 0) : (parseInt(kExP2.pk) || 0)) : 0;
            const validHybrid = isHybrid ? (kExP1?.kem == kExP2?.kem ? false : true ) : true;
            
            const sigSize = sigP ? (parseInt(sigP['sig size']) || 0) : 0;
            const ocspBytes = useOcsp ? (parseInt(sigPOcsp['sig size']) || 0) : 0;
            const sctBytes = useSct ? ((parseInt(sigPCt['sig size']) || 0) * sctCount) : 0;
            
            const serverHelloTotal = (res1 + res2) + sigSize + ocspBytes + sctBytes;
            const totalSum = clientHelloTotal + serverHelloTotal;

            // Nist tooltip
            let tt = `
            <span class="tooltip-container">
                        <span class="help-icon">?</span>
                        <div class="tooltip-box" style="width: 180px;">
                            NIST security Levels define the strength of schemes againt quantum-attacks. 
                        <a href="https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization/evaluation-criteria/security-(evaluation-criteria)" target="_blank">More</a>
                        </div>
                    </span>
            `

            // Hybrid Warning
            let hybridWarning = `
            <span class="tooltip-container">
                        <span class="help-icon">!</span>
                        <div class="tooltip-box" style="width: 360px;">
                            A hybrid key exchange usually consists of one KEM and one PKE scheme.
                            You have selected two schemes from the same category. While this is possible within this calculator,
                            there would be no real use-case in life environments.
                        </div>
                    </span>
            `

            // Titel
            const title = (isHybrid ? `${kExS1.Scheme} + ${kExS2.Scheme}` : (kExS1?.Scheme || "")) + 
                          ((kExS1 || kExS2) && sigS ? " / " : "") + 
                          (sigS ? sigS.Scheme : "") + 
                          (validHybrid ? "" : hybridWarning);

            const wrapper = document.createElement('div');
            wrapper.className = 'set-wrapper';

            // --- Header ---
            let html = `
                <div class="set-summary">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="delete-btn" title="Delete">&times;</span>
                        <span class="set-title">${title}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="set-total-badge">${totalSum} B</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div class="set-details">`;

            // --- Key Exchange ---
            if (isHybrid) {
                const linkA = kExS1.link && kExS1.link.length > 0 ? kExS1.link : "#";
                const linkA2 = kExS2.link && kExS2.link.length > 0 ? kExS2.link : "#";
                html += `
                <div class="result-section">
                    <strong>Key Exchange 1:</strong>
                    <div class="result-line">Scheme: <a href="${linkA}" target="_blank">${kExS1.Scheme}</a>${validHybrid ? "" : hybridWarning}</div>
                    <div class="result-line">Parameterset: ${kExP1.Parameterset}</div>
                    <div class="result-line">NIST Level: ${kExP1['nist-sec-level'] || '-'}${tt}</div>
                </div>
                <div class="result-section">
                    <strong>Key Exchange 2:</strong>
                    <div class="result-line">Scheme: <a href="${linkA2}" target="_blank">${kExS2.Scheme}</a>${validHybrid ? "" : hybridWarning}</div>
                    <div class="result-line">Parameterset: ${kExP2.Parameterset}</div>
                    <div class="result-line">NIST Level: ${kExP2['nist-sec-level'] || '-'}${tt}</div>
                </div>`;
            } else if (kExS1 && kExP1) {
                const linkA = kExS1.link && kExS1.link.length > 0 ? kExS1.link : "#";
                html += `
                <div class="result-section">
                    <strong>Key Exchange:</strong>
                    <div class="result-line">Scheme: <a href="${linkA}" target="_blank">${kExS1.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${kExP1.Parameterset}</div>
                    <div class="result-line">NIST Level: ${kExP1['nist-sec-level'] || '-'}${tt}</div>
                </div>`;
            }

            // --- Signature ---
            if (sigS && sigP) {
                const linkB = sigS.Website && sigS.Website.length > 0 ? sigS.Website : "#";
                html += `
                <div class="result-section">
                    <strong>Signature Scheme:</strong>
                    <div class="result-line">Scheme: <a href="${linkB}" target="_blank">${sigS.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${sigP.Parameterset}</div>
                    <div class="result-line">NIST Level: ${sigP['Security level']}${tt}</div>
                </div>`;
            }

            // --- Client Hello ---
            html += `<div class="result-section"><strong>Client Hello:</strong>`;
            if (isHybrid) {
                html += `
                    <div class="result-line">Public Key 1 Size: ${pk1} bytes</div>
                    <div class="result-line">Public Key 2 Size: ${pk2} bytes</div>
                    <div class="result-line">Client Hello Size ${useEncPk ? ' (encrypted)' : ''}: ${clientHelloTotal} bytes</div></div>`;
            }
            else{
                html += `
                <div class="result-line">Public Key Size: ${pk1} bytes</div>
                <div class="result-line">Client Hello Size ${useEncPk ? ' (encrypted)' : ''}: ${clientHelloTotal} bytes</div></div>`;
            }
            

            // --- Server Hello ---
            html += `<div class="result-section"><strong>Server Hello:</strong>`;
            if (isHybrid) {
                const label1 = (kExP1.kem == '1') ? 'Ciphertext' : 'Public Key';
                const label2 = (kExP2.kem == '1') ? 'Ciphertext' : 'Public Key';
                html += `
                    <div class="result-line">${label1} ${res1} bytes</div>
                    <div class="result-line">${label2} ${res2} bytes</div>`;
            } else {
                const label = (kExP1 && kExP1.kem == '1') ? 'Ciphertext' : 'Public Key';
                html += `<div class="result-line">${label}: ${res1} bytes</div>`;
            }
            
            html += `
                <div class="result-line">Signature: ${sigP ? sigSize + ' bytes' : '<em>(missing)</em>'}</div>
                ${useOcsp ? `<div class="result-line">OCSP stapling: ${ocspBytes} bytes</div>` : ''}
                ${useSct ? `<div class="result-line">SCT (${sctCount}): ${sctBytes} bytes</div>` : ''}
                <div class="result-line">Server Hello Size: ${serverHelloTotal} bytes</div>
            </div>`;

            // --- Total ---
            html += `
            <div class="result-section">
                <strong>&sum; ${totalSum} bytes Handshake</strong>
            </div>`;

            html += `</div>`; 
            wrapper.innerHTML = html;

            // --- Delete ---
            const delBtn = wrapper.querySelector('.delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                configHistory = configHistory.filter(item => item.id !== set.id);
                renderHistory();
            });

            wrapper.querySelector('.set-summary').addEventListener('click', () => wrapper.classList.toggle('is-expanded'));
            (index % 2 === 0 ? colLeft : colRight).appendChild(wrapper);
        });
    }
});