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

    const pkiDataSchemes = parseCSVtoObjects(rawPKIschemes);
    const pkiDataParams = parseCSVtoObjects(rawPKIparams);
    const schemesData = parseCSVtoObjects(rawSchemes);
    const paramsData = parseCSVtoObjects(rawParams);

    const inputA = document.getElementById('inputA');
    const listA = document.getElementById('listA');
    const inputA1 = document.getElementById('inputA1');
    const listA1 = document.getElementById('listA1');
    const checkHybrid = document.getElementById('checkHybrid');
    const hybridInputs = document.getElementById('hybrid-inputs');
    const inputA2 = document.getElementById('inputA2');
    const listA2 = document.getElementById('listA2');
    const inputA2_1 = document.getElementById('inputA2_1');
    const listA2_1 = document.getElementById('listA2_1');
    const inputB = document.getElementById('inputB');
    const listB = document.getElementById('listB');
    const inputC = document.getElementById('inputC');
    const listC = document.getElementById('listC');
    const addBtn = document.getElementById('addBtn');
    const resultBox = document.getElementById('result-box');
    const emptyState = document.getElementById('empty-state');
    const checkD = document.getElementById('checkD');
    const checkE = document.getElementById('checkE');
    const inputSctCount = document.getElementById('inputSctCount');
    const checkF = document.getElementById('checkF');

    let configHistory = [];

    checkHybrid.addEventListener('change', () => {
        if (checkHybrid.checked) {
            hybridInputs.classList.remove('hidden');
            document.getElementById('labelA').textContent = "Key Exchange - KEM"
            const kemOnly = pkiDataSchemes.filter(d => d.kem == "1");
            setupCustomDropdown(inputA, listA, kemOnly, 'Scheme', (val) => updateListA1(val));
            const classicOnly = pkiDataSchemes.filter(d => d.kem == "0");
            setupCustomDropdown(inputA2, listA2, classicOnly, 'Scheme', (val) => updateListA2_1(val));
        } else {
            hybridInputs.classList.add('hidden');
            document.getElementById('labelA').textContent = "Key Exchange"
            setupCustomDropdown(inputA, listA, pkiDataSchemes, 'Scheme', (val) => updateListA1(val));
        }
    });

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

    function updateListA1(scheme) {
        inputA1.value = "";
        const filtered = pkiDataParams.filter(row => row.Scheme === scheme);
        inputA1.disabled = filtered.length === 0;
        setupCustomDropdown(inputA1, listA1, filtered, 'Parameterset', null);
    }

    function updateListA2_1(scheme) {
        inputA2_1.value = "";
        const filtered = pkiDataParams.filter(row => row.Scheme === scheme);
        inputA2_1.disabled = filtered.length === 0;
        setupCustomDropdown(inputA2_1, listA2_1, filtered, 'Parameterset', null);
    }

    function updateListC(scheme) {
        inputC.value = "";
        const filtered = paramsData.filter(row => row.Scheme === scheme);
        inputC.disabled = filtered.length === 0;
        setupCustomDropdown(inputC, listC, filtered, 'Parameterset', null);
    }

    setupCustomDropdown(inputA, listA, pkiDataSchemes, 'Scheme', (val) => updateListA1(val));
    setupCustomDropdown(inputB, listB, schemesData, 'Scheme', (val) => updateListC(val));

    checkD.addEventListener('change', () => { if (checkD.checked) { checkE.checked = false; inputSctCount.classList.add('hidden'); }});
    checkE.addEventListener('change', () => { 
        if (checkE.checked) { checkD.checked = false; inputSctCount.classList.remove('hidden'); } 
        else { inputSctCount.classList.add('hidden'); }
    });

    addBtn.addEventListener('click', () => {
        const rowA = pkiDataSchemes.find(d => d.Scheme === inputA.value);
        const rowA1 = pkiDataParams.find(d => d.Parameterset === inputA1.value && d.Scheme === inputA.value);
        const isHybrid = checkHybrid.checked;
        const rowA2 = isHybrid ? pkiDataSchemes.find(d => d.Scheme === inputA2.value) : null;
        const rowA21 = isHybrid ? pkiDataParams.find(d => d.Parameterset === inputA2_1.value && d.Scheme === inputA2.value) : null;
        const rowB = schemesData.find(d => d.Scheme === inputB.value);
        const rowC = paramsData.find(d => d.Parameterset === inputC.value && d.Scheme === inputB.value);

        if ((!rowA || !rowA1) && (!rowB || !rowC)) { alert("Bitte Konfiguration vervollständigen."); return; }
        if (isHybrid && (!rowA2 || !rowA21)) { alert("Bitte beide Hybrid-Sets vervollständigen."); return; }

        configHistory.push({
            id: Date.now(), rowA, rowA1, rowA2, rowA21, rowB, rowC, isHybrid,
            useOcsp: checkD.checked, useSct: checkE.checked, 
            sctCount: parseInt(inputSctCount.value) || 3, useEncPk: checkF.checked
        });

        renderHistory();
        inputA.value = ""; inputA1.value = ""; inputA2.value = ""; inputA2_1.value = ""; inputB.value = ""; inputC.value = "";
    });

    function renderHistory() {
        if (configHistory.length === 0) return;
        emptyState.style.display = 'none';
        resultBox.classList.remove('hidden');

        const colLeft = document.getElementById('col-left');
        const colRight = document.getElementById('col-right');
        colLeft.innerHTML = ""; colRight.innerHTML = "";

        configHistory.forEach((set, index) => {
            const { rowA, rowA1, rowA2, rowA21, rowB, rowC, isHybrid, useOcsp, useSct, sctCount, useEncPk } = set;

            // --- Basenberechnung ---
            const pk1 = parseInt(rowA1?.pk) || 0;
            const pk2 = isHybrid ? (parseInt(rowA21?.pk) || 0) : 0;
            const clientHelloPKTotal = pk1 + pk2;
            const clientHelloTotal = useEncPk ? 2 * clientHelloPKTotal : clientHelloPKTotal;

            const res1 = (rowA1?.kem == '1') ? (parseInt(rowA1.ct) || 0) : (parseInt(rowA1.pk) || 0);
            const res2 = isHybrid ? ((rowA21?.kem == '1') ? (parseInt(rowA21.ct) || 0) : (parseInt(rowA21.pk) || 0)) : 0;
            
            const sigSize = rowC ? (parseInt(rowC['sig size']) || 0) : 0;
            const ocspBytes = useOcsp ? OCSP_SIZE : 0;
            const sctBytes = useSct ? (sigSize * sctCount) : 0;
            
            const serverHelloTotal = (res1 + res2) + sigSize + ocspBytes + sctBytes;
            const totalSum = clientHelloTotal + serverHelloTotal;

            // Titel
            const title = (isHybrid ? `${rowA.Scheme} + ${rowA2.Scheme}` : (rowA?.Scheme || "")) + 
                          ((rowA || rowA2) && rowB ? " / " : "") + 
                          (rowB ? rowB.Scheme : "");

            const wrapper = document.createElement('div');
            wrapper.className = 'set-wrapper';

            // --- Header ---
            let html = `
                <div class="set-summary">
                    <span class="set-title">${title}</span>
                    <span class="set-total-badge">${totalSum} B</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="set-details">`;

            // --- Key Exchange Sektion ---
            if (isHybrid) {
                const linkA = rowA.link && rowA.link.length > 0 ? rowA.link : "#";
                const linkA2 = rowA2.link && rowA2.link.length > 0 ? rowA2.link : "#";
                html += `
                <div class="result-section">
                    <strong>Key Exchange - KEM:</strong>
                    <div class="result-line">Scheme: <a href="${linkA}" target="_blank">${rowA.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${rowA1.Parameterset}</div>
                    <div class="result-line">NIST Level: ${rowA1['nist-sec-level'] || '-'}</div>
                </div>
                <div class="result-section">
                    <strong>Key Exchange - PKI:</strong>
                    <div class="result-line">Scheme: <a href="${linkA2}" target="_blank">${rowA2.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${rowA21.Parameterset}</div>
                    <div class="result-line">NIST Level: ${rowA21['nist-sec-level'] || '-'}</div>
                </div>`;
            } else if (rowA && rowA1) {
                const linkA = rowA.link && rowA.link.length > 0 ? rowA.link : "#";
                html += `
                <div class="result-section">
                    <strong>Key Exchange:</strong>
                    <div class="result-line">Scheme: <a href="${linkA}" target="_blank">${rowA.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${rowA1.Parameterset}</div>
                    <div class="result-line">NIST Level: ${rowA1['nist-sec-level'] || '-'}</div>
                </div>`;
            }

            // --- Signature Sektion ---
            if (rowB && rowC) {
                const linkB = rowB.Website && rowB.Website.length > 0 ? rowB.Website : "#";
                html += `
                <div class="result-section">
                    <strong>Signature Scheme:</strong>
                    <div class="result-line">Scheme: <a href="${linkB}" target="_blank">${rowB.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${rowC.Parameterset}</div>
                    <div class="result-line">NIST Level: ${rowC['Security level']}</div>
                </div>`;
            }

            // --- Client Hello Sektion ---
            html += `<div class="result-section"><strong>Client Hello:</strong>`;
            if (isHybrid) {
                html += `
                    <div class="result-line">KEM Public Key Size: ${pk1} bytes</div>
                    <div class="result-line">PKI Public Key Size: ${pk2} bytes</div>
                    <div class="result-line">Client Hello Size: ${useEncPk ? ' (encrypted)' : ''}: ${clientHelloTotal} bytes</div></div>`;
            }
            else{
                html += `
                <div class="result-line">Public Key Size: ${pk1} bytes</div>
                <div class="result-line">Client Hello Size: ${useEncPk ? ' (encrypted)' : ''}: ${clientHelloTotal} bytes</div></div>`;
            }
            

            // --- Server Hello Sektion ---
            html += `<div class="result-section"><strong>Server Hello:</strong>`;
            if (isHybrid) {
                const label1 = (rowA1.kem == '1') ? 'Ciphertext' : 'Public Key';
                const label2 = (rowA21.kem == '1') ? 'Ciphertext' : 'Public Key';
                html += `
                    <div class="result-line">${label1} ${res1} bytes</div>
                    <div class="result-line">${label2} ${res2} bytes</div>`;
            } else {
                const label = (rowA1 && rowA1.kem == '1') ? 'Ciphertext' : 'Public Key';
                html += `<div class="result-line">${label}: ${res1} bytes</div>`;
            }
            
            html += `
                <div class="result-line">Signature: ${rowC ? sigSize + ' bytes' : '<em>(missing)</em>'}</div>
                ${useOcsp ? `<div class="result-line">OCSP stapling: ${ocspBytes} bytes</div>` : ''}
                ${useSct ? `<div class="result-line">Cert timestamps (${sctCount}): ${sctBytes} bytes</div>` : ''}
                <div class="result-line"><b>Server Hello Size: ${serverHelloTotal} bytes</b></div>
            </div>`;

            // --- Gesamtsumme ---
            html += `
            <div class="result-section">
                <strong>&sum; ${totalSum} bytes Handshake</strong>
            </div>`;

            html += `</div>`; // Ende set-details
            wrapper.innerHTML = html;
            wrapper.querySelector('.set-summary').addEventListener('click', () => wrapper.classList.toggle('is-expanded'));
            (index % 2 === 0 ? colLeft : colRight).appendChild(wrapper);
        });
    }
});