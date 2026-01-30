document.addEventListener('DOMContentLoaded', () => {

    // --- const - placeholders for now --- 
    const OCSP_SIZE = 500; 
    const SCT_SIZE = 200;  

    // ---  csv parser  ---
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

    // --- load data ---
    const pkiDataSchemes = parseCSVtoObjects(rawPKIschemes);
    const pkiDataParams = parseCSVtoObjects(rawPKIparams);
    const schemesData = parseCSVtoObjects(rawSchemes);
    const paramsData = parseCSVtoObjects(rawParams);

    // --- dom elements ---
    const inputA = document.getElementById('inputA');
    const listA = document.getElementById('listA');
    const inputA1 = document.getElementById('inputA1');
    const listA1 = document.getElementById('listA1');
    const inputB = document.getElementById('inputB');
    const listB = document.getElementById('listB');
    const inputC = document.getElementById('inputC');
    const listC = document.getElementById('listC');
    
    const addBtn = document.getElementById('addBtn');
    const resultBox = document.getElementById('result-box');
    const resultContent = document.getElementById('result-content');
    const emptyState = document.getElementById('empty-state');
    
    const checkD = document.getElementById('checkD');
    const checkE = document.getElementById('checkE');
    const inputSctCount = document.getElementById('inputSctCount');
    const checkF = document.getElementById('checkF');


    // History
    let configHistory = [];

    // --- Ocsp OR Ct ---
    checkD.addEventListener('change', () => {
        if (checkD.checked) {
            checkE.checked = false;
            inputSctCount.classList.add('hidden');
        }
    });

    checkE.addEventListener('change', () => {
        if (checkE.checked) {
            checkD.checked = false;
            inputSctCount.classList.remove('hidden');
        } else {
            inputSctCount.classList.add('hidden');
        }
    });


    // --- Neat dropdowns ---
    function setupCustomDropdown(inputElement, listElement, dataArray, displayKey, onSelect) {
        
        function renderOptions(filterText = "") {
            listElement.innerHTML = "";
            const lowerFilter = filterText.toLowerCase();

            const filtered = dataArray.filter(item => {
                const val = item[displayKey] ? item[displayKey].toString() : "";
                return val.toLowerCase().includes(lowerFilter);
            });

            if (filtered.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'dropdown-option';
                noResult.style.color = '#777';
                noResult.style.cursor = 'default';
                noResult.textContent = "No hits";
                listElement.appendChild(noResult);
                return;
            }

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

        inputElement.addEventListener('focus', () => {
            renderOptions(inputElement.value);
            listElement.classList.add('show');
        });

        inputElement.addEventListener('input', () => {
            renderOptions(inputElement.value);
            listElement.classList.add('show');
        });

        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !listElement.contains(e.target)) {
                listElement.classList.remove('show');
            }
        });
    }

    // --- initializing dropdowns ---

    // pki's
    //setupCustomDropdown(inputA, listA, pkiDataSchemes, 'Scheme', null);

    setupCustomDropdown(inputA, listA, pkiDataSchemes, 'Scheme', (selectedValue) => {
        updateListA1(selectedValue);
    });

    // Parametersets
    let currentSchemesParamsData = [];

    function updateListA1(schemeA) {
        inputA1.value = "";
        listA1.innerHTML = "";
        
        currentSchemesParamsData = pkiDataParams.filter(row => row.Scheme === schemeA);

        if (currentSchemesParamsData.length > 0) {
            inputA1.disabled = false;
            inputA1.placeholder = "Select Parameterset";
            setupCustomDropdown(inputA1, listA1, currentSchemesParamsData, 'Parameterset', null);
        } else {
            inputA1.disabled = true;
            inputA1.placeholder = "No Parametersets found";
            listA1.innerHTML = "";
        }
    }

    setupCustomDropdown(inputA1, listA1, [], 'Parameterset', null);

    // Signature Schemes
    setupCustomDropdown(inputB, listB, schemesData, 'Scheme', (selectedValue) => {
        updateListC(selectedValue);
    });

    // Parametersets
    let currentParamsData = [];

    function updateListC(schemeB) {
        inputC.value = "";
        listC.innerHTML = "";
        
        currentParamsData = paramsData.filter(row => row.Scheme === schemeB);

        if (currentParamsData.length > 0) {
            inputC.disabled = false;
            inputC.placeholder = "Select Parameterset";
            setupCustomDropdown(inputC, listC, currentParamsData, 'Parameterset', null);
        } else {
            inputC.disabled = true;
            inputC.placeholder = "No Parametersets found";
            listC.innerHTML = "";
        }
    }

    setupCustomDropdown(inputC, listC, [], 'Parameterset', null);


    // --- buttons ---

    addBtn.addEventListener('click', () => {
        const valA = inputA.value;
        const valA1 = inputA1.value;
        const valB = inputB.value;
        const valC = inputC.value;
        
        // get checkbox state
        const useOcsp = checkD.checked;
        const useSct = checkE.checked;
        const sctCount = useSct ? (parseInt(inputSctCount.value) || 3) : 0;
        const useEncPk = checkF.checked;

        // get data for selected options
        const rowA = pkiDataSchemes.find(d => d.Scheme === valA);
        const rowA1 = pkiDataParams.find(d => d.Parameterset === valA1 && d.Scheme === valA);
        const rowB = schemesData.find(d => d.Scheme === valB);
        const rowC = paramsData.find(d => d.Parameterset === valC && d.Scheme === valB);

        // validate
        if ((!rowA || !rowA1) && (!rowB || !rowC)) {
            alert("Please finish your config first!");
            return;
        }

        // create new data set
        const newSet = {
            id: Date.now(),
            rowA: rowA,
            rowA1: rowA1,
            rowB: rowB,
            rowC: rowC,
            useOcsp: useOcsp, 
            useSct: useSct,
            useEncPk: useEncPk,
            sctCount: sctCount    
        };

        // add to history, limit size
        configHistory.push(newSet);

        renderHistory();

        // --- reset selection ---
        inputA.value = "";
        inputA1.value = "";
        inputB.value = "";
        inputC.value = "";
     
        checkD.checked = false; 
        checkE.checked = false;
        inputSctCount.classList.add('hidden');
        checkF.checked = false;

        inputC.disabled = true;
        inputC.placeholder = "Select scheme first...";
        listC.innerHTML = ""; 
    });

    // render existing configs
    function renderHistory() {
        if (configHistory.length === 0) {
            resultBox.classList.add('hidden');
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        resultBox.classList.remove('hidden');

        const colLeft = document.getElementById('col-left');
        const colRight = document.getElementById('col-right');

        colLeft.innerHTML = "";
        colRight.innerHTML = "";
        
        configHistory.forEach((set, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'set-wrapper';
            // let html = `<div class="set-header">Configuration ${index + 1}</div>`;

            // get data from set
            const { rowA, rowA1, rowB, rowC, useOcsp, useSct, sctCount, useEncPk } = set;

            // Berechne Zusatz-Bytes
            const ocspBytes = useOcsp ? OCSP_SIZE : 0;
            const sctBytes = useSct ? (sigSize * sctCount) : 0;
            
            // gesamtsumme berechnen
            if (rowA1 && rowA1.kem == '1') { useKEM = true}
            if (rowA1 && rowA1.kem == '0') { useKEM = false}

            const ctSize = parseInt(rowA1.ct) || 0;
            const pkSize = parseInt(rowA1.pk) || 0;

            const sigSize = rowC ? (parseInt(rowC['sig size']) || 0) : 0;

            var totalSum = (useEncPk ? 2*pkSize : pkSize) + ocspBytes + sctBytes + (useKEM ? ctSize : pkSize) + sigSize;

            // Titel erstellen 

            const title = (rowA && rowA1 ? rowA.Scheme : "") +  ((rowA && rowA1) && (rowB && rowC) ? " + " : "") + (rowB && rowC ? rowB.Scheme : "");

            // header
            let html = `
                <div class="set-summary">
                    <span class="set-title">${title}</span>
                    <span class="set-total-badge">${totalSum} Bytes</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="set-details">`;

            // PKI
            if (rowA && rowA1) {
                const linkA = rowA.link && rowA.link.length > 0 ? rowA.link : "#";
                html += `
                <div class="result-section">
                    <strong>Key Exchange:</strong>
                    <div class="result-line">Scheme: <a href="${linkA}" target="_blank">${rowA.Scheme}</a></div>
                    <div class="result-line">Parameterset: ${rowA1.Parameterset}</div>
                    <div class="result-line">NIST Level: ${rowA1['nist-sec-level'] || '-'}</div>
                </div>`;
                }

            // Signature
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

            // Client Hello
            if (rowA1) {
                html += `
                <div class="result-section">
                    <strong>Client Hello:</strong>
                    <div class="result-line">Public Key Size${useEncPk ?' (encrypted): ' +  2*rowA1.pk:': ' + rowA1.pk} byte</div>
                </div>`;
                //totalSum += parseInt(useEncPk ? 2*rowA1.pk : rowA1.pk)
            }

            // Server Hello
            
            // lil help for optional lines
            function getOptionalLines() {
                let lines = "";
                if (useOcsp) {
                    lines += `<div class="result-line">Ocsp stapeling: ${ocspBytes} bytes</div>`;
                    totalSum += ocspBytes
                }
                if (useSct) {
                    lines += `<div class="result-line">Certificate timestamps(${sctCount}): ${sctBytes} bytes</div>`;
                    //totalSum += parseInt(sctBytes)
                }
                return lines;
            }

            // KEM
            if (rowA1 && rowA1.kem == '1') {
                //const ctSize = parseInt(rowA1.ct) || 0;
                //const sigSize = rowC ? (parseInt(rowC['sig size']) || 0) : 0;
                
                // Total size
                const total = ctSize + sigSize + ocspBytes + sctBytes;

                html += `
                <div class="result-section">
                    <strong>Server Hello:</strong>
                    <div class="result-line">Ciphertext: ${ctSize} bytes</div>
                    <div class="result-line">Signature: ${rowC ? sigSize + ' bytes' : '<em>(Fehlt)</em>'}</div>
                    ${getOptionalLines()}
                    <div class="result-line"><b>Total: ${total} bytes</b></div>
                </div>`;
                //totalSum += parseInt(total)
            }
            
            // Public Key
            if (rowA1 && rowA1.kem == '0') {
                //const pkSize = parseInt(rowA1.pk) || 0;
                //const sigSize = rowC ? (parseInt(rowC['sig size']) || 0) : 0;
                
                // Total size
                const total = pkSize + sigSize + ocspBytes + sctBytes;

                html += `
                <div class="result-section">
                    <strong>Server Hello:</strong>
                    <div class="result-line">Public Key: ${pkSize} bytes</div>
                    <div class="result-line">Signature: ${rowC ? sigSize + ' bytes' : '<em>(Fehlt)</em>'}</div>
                    ${getOptionalLines()}
                    <div class="result-line"><b>Total: ${total} bytes</b></div>
                </div>`;
                //totalSum += parseInt(total)
            }

             //calculate total size
            //const totalSum = (rowA && rowA1 ? (useEncPk ? 2*rowA1.pk : rowA1.pk) : 0) + (rowB && rowC ? )

            // Sum
            if (rowA && rowA1 || rowB && rowC) {
                html += `
                <div class="result-section">
                    <strong>&sum; ${totalSum} bytes</strong>
                </div>`;
            }

            wrapper.innerHTML = html;

            wrapper.querySelector('.set-summary').addEventListener('click', () => {
                wrapper.classList.toggle('is-expanded');
            });

            if (index % 2 === 0) {
            colLeft.appendChild(wrapper);
        } else {
            colRight.appendChild(wrapper);
        }
        });
    }
});