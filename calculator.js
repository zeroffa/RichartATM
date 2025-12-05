// 預先定義的速算金額列表
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000];
const MIN_FEE = 100; // 最低手續費
let costInputCounter = 0; // 用於給每筆買入紀錄一個唯一的 ID

function formatCurrency(number, currencySymbol) {
    if (isNaN(number)) return '';
    let displayValue;
    if (currencySymbol === 'NT$') {
        displayValue = Math.round(number).toLocaleString('zh-TW');
    } else if (currencySymbol === '¥') {
        displayValue = Math.round(number).toLocaleString('zh-TW');
    } else {
        displayValue = number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return `${currencySymbol}${displayValue}`;
}

function setAmount(value, fromQuickButton = false, isInternalUpdate = false) {
    const amountInput = document.getElementById('amount');
    const recordCount = document.querySelectorAll('.cost-input-row').length;
    
    if (fromQuickButton && !isInternalUpdate && recordCount > 1) {
        alert("【多筆日幣計算中】\n\n警告：您目前有多筆買入紀錄，正在計算加權平均成本。\n\n此快速按鈕僅更改上方的「本次提領日圓金額」，您的多筆買入成本紀錄不會被影響。");
    }

    if (parseFloat(amountInput.value) !== value) {
        amountInput.value = value;
    }
    
    if (!isInternalUpdate) {
        calculateCost(); 
    }
}

function calculateUnitCost(amount, cost, spotRate, cashRate) {
    const feePreliminary = amount * (cashRate - spotRate) * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    return totalExpense;
}

function toggleContent(contentId, buttonId) {
    const content = document.getElementById(contentId);
    const button = document.getElementById(buttonId);
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        if (button) button.innerText = '點此隱藏';
    } else {
        content.style.display = 'none';
        if (button) button.innerText = '點此顯示';
    }
}

function addCostInput(jpyAmount = 50000, rate = 0.1989, isDefault = false) {
    const container = document.getElementById('costInputsContainer');
    const id = costInputCounter++;

    if (isDefault) {
        container.innerHTML = `
            <div class="cost-input-header">
                <span class="label-jpy">日圓金額 (¥)</span>
                <span class="label-rate">買進成本 (NTD/JPY)</span>
                <span style="width: 30px;"></span>
            </div>
        `;
    }
    
    const div = document.createElement('div');
    div.className = 'cost-input-row';
    div.id = `cost-row-${id}`;
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.value = jpyAmount;
    amountInput.step = 1;
    amountInput.min = 0;
    amountInput.className = 'cost-jpy-amount label-jpy';
    amountInput.addEventListener('input', calculateCost); 

    const rateInput = document.createElement('input');
    rateInput.type = 'number';
    rateInput.value = rate;
    rateInput.step = 0.0001;
    rateInput.className = 'cost-rate-value label-rate';
    rateInput.addEventListener('input', calculateCost); 

    const removeButton = document.createElement('button');
    removeButton.innerHTML = '&times;';
    removeButton.title = '刪除此筆紀錄';
    removeButton.className = 'remove-btn'; 
    removeButton.onclick = () => removeCostInput(id);

    div.appendChild(amountInput);
    div.appendChild(rateInput);
    div.appendChild(removeButton);
    
    if (isDefault && id === 0) {
        removeButton.style.visibility = 'hidden'; 
    } else {
        removeButton.style.visibility = 'visible';
    }
    
    container.appendChild(div);
    calculateCost(); 
}

function removeCostInput(id) {
    const row = document.getElementById(`cost-row-${id}`);
    const container = document.getElementById('costInputsContainer');
    const rows = container.querySelectorAll('.cost-input-row');
    
    if (row && rows.length > 1) { 
        row.remove();
        calculateCost(); 
        
        const remainingRows = container.querySelectorAll('.cost-input-row');
        if (remainingRows.length === 1) {
             remainingRows[0].querySelector('.remove-btn').style.visibility = 'hidden';
        }

    } else if (rows.length === 1) {
        alert("必須至少保留一筆日圓買入成本紀錄。");
    }
}

function updateInputState(recordCount, totalJPY) {
    const amountInput = document.getElementById('amount');
    const modeHint = document.getElementById('modeHint');
    const resultTitle = document.getElementById('resultTitle');

    if (recordCount > 1) {
        amountInput.disabled = true;
        amountInput.classList.add('readonly-field');
        amountInput.value = totalJPY; 
        
        modeHint.innerText = '🔒 自動鎖定模式：金額已同步為總買入日圓 (加權平均)';
        modeHint.className = 'hint-multi';
        resultTitle.innerHTML = '計算結果 <span style="font-size:0.8em; color:#cc0000;">(多筆加權平均模式)</span>';
        
    } else {
        amountInput.disabled = false;
        amountInput.classList.remove('readonly-field');
        
        modeHint.innerText = '✓ 單筆模式：可自由輸入提領金額';
        modeHint.className = 'hint-single';
        resultTitle.innerHTML = '計算結果 <span style="font-size:0.8em; color:#444;">(單筆一般模式)</span>';
    }
}

function getAverageCost() {
    const jpyInputs = document.querySelectorAll('.cost-jpy-amount');
    const rateInputs = document.querySelectorAll('.cost-rate-value');
    
    let totalJPY = 0;
    let totalNTD = 0;
    let validRecords = 0;

    jpyInputs.forEach((jpyInput, index) => {
        const rateInput = rateInputs[index];
        const jpy = parseFloat(jpyInput.value);
        const rate = parseFloat(rateInput.value);
        
        if (!isNaN(jpy) && jpy > 0 && !isNaN(rate) && rate > 0) {
            totalJPY += jpy;
            totalNTD += jpy * rate;
            validRecords++;
        }
    });

    const averageCost = totalJPY > 0 ? (totalNTD / totalJPY) : NaN;
    
    const titleElement = document.getElementById('costInputTitle');
    const displayElement = document.getElementById('averageCostDisplay');
    let costTitle = "單一買進成本";
    
    if (validRecords > 1) {
        costTitle = "加權平均成本";
        titleElement.innerHTML = `日圓買入成本紀錄 (分批買入計算**加權平均成本**) <span class="default-hint">(請輸入您手上所有日圓的買入紀錄)</span>`;
        if (totalJPY > 0) {
            setAmount(totalJPY, false, true); 
        }
    } else {
        costTitle = "單一買進成本";
        titleElement.innerHTML = `日圓買入成本紀錄 (預設單一成本) <span class="default-hint">(如有多筆，請按下方按鈕新增)</span>`;
    }

    if (validRecords > 0) {
        displayElement.innerHTML = `
            總買入日圓：<span style="color:#cc0000;">${formatCurrency(totalJPY, '¥')}</span> | 
            **${costTitle}**：<span style="color:#cc0000;">${averageCost.toFixed(6)}</span> NTD/JPY
        `;
    } else {
        displayElement.innerHTML = `請新增有效的日圓買入紀錄`;
    }

    updateInputState(validRecords, totalJPY);

    return { averageCost, totalJPY, recordCount: validRecords, costTitle };
}

function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    const { costTitle } = getAverageCost(); 
    
    if (isNaN(cost)) {
        quickDifferenceElement.innerHTML = `<p style="color:red; font-size:0.9em;">請先輸入有效的日圓買入成本紀錄，才能計算速算。</p>`;
        return;
    }
    
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>提領金額 (日圓)</th>
                    <th>Richart 總支出</th>
                    <th>台銀 Easy購總成本</th>
                    <th>差價 (節省金額)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    QUICK_AMOUNTS.forEach(amount => {
        const richartExpense = calculateUnitCost(amount, cost, spotRate, cashRate);
        const externalCost = amount * compareRate;
        const savings = externalCost - richartExpense;
        const diffClass = savings >= 0 ? 'positive-diff' : 'negative-diff';
        
        tableHtml += `
            <tr>
                <td>${formatCurrency(amount, '¥')}</td> 
                <td>${formatCurrency(richartExpense, 'NT$')}</td>
                <td>${formatCurrency(externalCost, 'NT$')}</td>
                <td class="${diffClass}">${formatCurrency(savings, 'NT$')}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    
    quickDifferenceElement.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【不同金額差價速算 (手續費攤提影響)】</p>
        <p style="font-size:0.8em;">(使用匯率：${costTitle} **${cost.toFixed(6)}** / 即期 **${spotRate.toFixed(4)}** / 現鈔 **${cashRate.toFixed(4)}**)</p>
        ${tableHtml}
    `;
}


function calculateCost() {
    const amount = parseFloat(document.getElementById('amount').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 
    
    const { averageCost: cost, totalJPY: totalJPY, costTitle } = getAverageCost();
    
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    const finalAmount = parseFloat(document.getElementById('amount').value);

    if (isNaN(finalAmount) || finalAmount <= 0 || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate)) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查提領金額及所有匯率/成本數值是否正確填寫。</p>`;
        detailCalculation.style.display = 'none';
        quickDifference.style.display = 'none'; 
        return;
    }

    
    // --- Richart 手續費計算 ---
    const rateDifference = cashRate - spotRate;
    const feePreliminary_raw = finalAmount * rateDifference * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary_raw);
    
    let feeNoteSimple = ``;
    let feeNoteDetail = ``;

    if (actualFee === MIN_FEE && feePreliminary_raw < MIN_FEE) {
        feeNoteSimple = `<span style="color:#cc0000; font-weight:bold; font-size:0.9em;"> (會收最低手續費 NT$${MIN_FEE}，或可能更高)</span>`;
        
        const difference = MIN_FEE - feePreliminary_raw;
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額 ${formatCurrency(feePreliminary_raw, 'NT$')} 低於 NT$${MIN_FEE}，故會收最低手續費 (或更高)。 (被多收 ${formatCurrency(difference, 'NT$')})</p>`;
    } else {
        feeNoteDetail = `<p style="margin-left: 10px; color:#28a745; font-weight:bold;">→ 初算金額已超過或等於最低門檻，依計算金額收取。</p>`;
    }

    // V2.23 修正：為詳細計算過程準備正向的顯示邏輯 (現鈔 - 即期)
    const rateDifference_positive = cashRate - spotRate;
    const feePreliminary_positive = finalAmount * rateDifference_positive * 0.5;


    // --- Richart 總成本計算 ---
    const totalOriginalCost = finalAmount * cost; 
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / finalAmount;

    // --- 外部結匯成本比較 ---
    const externalCost = finalAmount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 更新簡要結果
    resultsContainer.innerHTML = `
        <p>實際提領手續費 (預估)：<span class="result-value">${formatCurrency(actualFee, 'NT$')}</span> ${feeNoteSimple}</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>台銀 Easy購總成本 (匯率 ${compareRate.toFixed(4)})：<span class="result-value">${formatCurrency(externalCost, 'NT$')}</span></p>
        <p><strong> Richart 提領淨節省金額：<span class="final-savings">${formatCurrency(savings, 'NT$')}</span> (負值表示較貴)</strong></p>
    `;

    // 7. 更新詳細計算過程
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【詳細計算過程】</p>
        <p>1. **${costTitle}**： <span class="final-cost">${cost.toFixed(6)}</span> 台幣/日圓</p>
        <p
