// 預先定義的速算金額列表
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000];
const MIN_FEE = 100; // 最低手續費
let costInputCounter = 0; // 用於給每筆買入紀錄一個唯一的 ID

/**
 * V2.14 修正：格式化數字為貨幣字串，NT$ 和 ¥ 都只顯示整數 (NT$ 四捨五入)。
 */
function formatCurrency(number, currencySymbol) {
    if (isNaN(number)) return '';
    
    let displayValue;
    
    if (currencySymbol === 'NT$') {
        // 台幣：四捨五入到整數
        displayValue = Math.round(number).toLocaleString('zh-TW');
    } 
    else if (currencySymbol === '¥') {
        // 日圓：取整數部分
        displayValue = Math.round(number).toLocaleString('zh-TW');
    }
    else {
        // 其他幣別：保留兩位小數
        displayValue = number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    return `${currencySymbol}${displayValue}`;
}

/**
 * V2.26 修正：設定快速金額按鈕的值。
 * 當模式為多筆輸入時(disabled)，快速按鈕不應生效或應提示。
 */
function setAmount(value, fromQuickButton = false) {
    const amountInput = document.getElementById('amount');
    
    // 如果輸入框被停用 (多筆模式)，則不允許快速按鈕修改
    if (amountInput.disabled) {
        if (fromQuickButton) {
            alert("【模式限制】\n\n目前處於「多筆加權平均模式」，提領金額已自動鎖定為總買入金額。\n\n若要手動設定金額，請刪除下方的買入紀錄至剩下 1 筆。");
        }
        return;
    }

    // 只有當新的值與舊的值不同時才更新
    if (parseFloat(amountInput.value) !== value) {
        amountInput.value = value;
    }
    
    calculateCost(); // 觸發重新計算
}

// 計算 Richart 提領的單一總成本 (用於速算)
function calculateUnitCost(amount, cost, spotRate, cashRate) {
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    return totalExpense;
}

// 切換內容顯示/隱藏的函數
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

/**
 * V2.18 修正：動態新增一組成本輸入框
 */
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

// 移除一組成本輸入框
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

/**
 * V2.26 新增：更新介面狀態 (單筆 vs 多筆)
 */
function updateInputState(recordCount, totalJPY) {
    const amountInput = document.getElementById('amount');
    const modeHint = document.getElementById('modeHint');
    const resultTitle = document.getElementById('resultTitle');

    if (recordCount > 1) {
        // 多筆模式：鎖定上方欄位
        amountInput.disabled = true;
        amountInput.classList.add('readonly-field');
        amountInput.value = totalJPY; // 強制同步
        
        modeHint.innerText = '🔒 自動鎖定模式：金額已同步為總買入日圓 (加權平均)';
        modeHint.className = 'hint-multi';
        resultTitle.innerHTML = '計算結果 <span style="font-size:0.8em; color:#cc0000;">(多筆加權平均模式)</span>';
        
    } else {
        // 單筆模式：解鎖
        amountInput.disabled = false;
        amountInput.classList.remove('readonly-field');
        
        modeHint.innerText = '✓ 單筆模式：可自由輸入提領金額';
        modeHint.className = 'hint-single';
        resultTitle.innerHTML = '計算結果 <span style="font-size:0.8em; color:#444;">(單筆一般模式)</span>';
    }
}

/**
 * V2.26 修正：計算加權平均，並呼叫 updateInputState 更新介面
 */
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
    
    // 更新標題和顯示
    const titleElement = document.getElementById('costInputTitle');
    const displayElement = document.getElementById('averageCostDisplay');
    let costTitle = "單一買進成本";
    
    if (validRecords > 1) {
        costTitle = "加權平均成本";
        titleElement.innerHTML = `日圓買入成本紀錄 <span class="default-hint">(目前為多筆加權模式)</span>`;
    } else {
        costTitle = "單一買進成本";
        titleElement.innerHTML = `日圓買入成本紀錄 <span class="default-hint">(預設單一成本，按+可新增)</span>`;
    }

    if (validRecords > 0) {
        displayElement.innerHTML = `
            總買入日圓：<span style="color:#cc0000;">${formatCurrency(totalJPY, '¥')}</span> | 
            **${costTitle}**：<span style="color:#cc0000;">${averageCost.toFixed(6)}</span> NTD/JPY
        `;
    } else {
        displayElement.innerHTML = `請新增有效的日圓買入紀錄`;
    }

    // **V2.26 關鍵呼叫：更新介面狀態**
    updateInputState(validRecords, totalJPY);

    return { averageCost, totalJPY, recordCount: validRecords, costTitle };
}


// 計算並更新速算區塊 (保持不變，略)
function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    const { costTitle } = getAverageCost(); // 取得成本名稱
    
    if (isNaN(cost)) {
        quickDifferenceElement.innerHTML = `<p style="color:red; font-size:0.9em;">請先輸入有效的日圓買入成本紀錄。</p>`;
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


// 核心計算函數
function calculateCost() {
    // 注意：如果是多筆模式，amount 輸入框被停用，但 value 已經被 setAmount 更新為總額
    const amountInput = document.getElementById('amount');
    const finalAmount = parseFloat(amountInput.value);

    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 
    
    const { averageCost: cost, totalJPY: totalJPY, costTitle } = getAverageCost();
    
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    if (isNaN(finalAmount) || finalAmount <= 0 || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate)) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查數值是否正確。</p>`;
        detailCalculation.style.display = 'none';
        quickDifference.style.display = 'none'; 
        return;
    }

    // 計算邏輯 (與 V2.24 相同)
    const feePreliminary_raw = finalAmount * (spotRate - cashRate) * 0.5;
    const rateDifference_positive = cashRate - spotRate;
    const feePreliminary_positive = finalAmount * rateDifference_positive * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary_raw);
    
    let feeNoteSimple = ``;
    if (actualFee === MIN_FEE) {
        feeNoteSimple = `<span style="color:#cc0000; font-weight:bold; font-size:0.9em;"> (會收最低手續費 NT$${MIN_FEE}，或可能更高)</span>`;
    }

    let feeNoteDetail = ``;
    if (feePreliminary_raw < 0) {
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額為負值，但根據規定，最低仍會收取 NT$${MIN_FEE} 手續費 (或更高)。</p>`;
    } else if (actualFee === MIN_FEE) {
        const difference = MIN_FEE - feePreliminary_raw;
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額 ${formatCurrency(feePreliminary_positive, 'NT$')} 低於 NT$${MIN_FEE}，故會收最低手續費 (或更高)。 (被多收 ${formatCurrency(difference, 'NT$')})</p>`;
    }

    const totalOriginalCost = finalAmount * cost; 
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / finalAmount;
    const externalCost = finalAmount * compareRate;
    const savings = externalCost - totalExpense;

    // 顯示結果
    resultsContainer.innerHTML = `
        <p>實際提領手續費 (預估)：<span class="result-value">${formatCurrency(actualFee, 'NT$')}</span> ${feeNoteSimple}</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>台銀 Easy購總成本 (匯率 ${compareRate.toFixed(4)})：<span class="result-value">${formatCurrency(externalCost, 'NT$')}</span></p>
        <p><strong> Richart 提領淨節省金額：<span class="final-savings">${formatCurrency(savings, 'NT$')}</span> (負值表示較貴)</strong></p>
    `;

    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【詳細計算過程】</p>
        <p>1. **${costTitle}**： <span class="final-cost">${cost.toFixed(6)}</span> 台幣/日圓</p>
        <p>2. 原始換匯成本： ${formatCurrency(finalAmount, '¥')} × ${cost.toFixed(6)} (平均成本) = ${formatCurrency(totalOriginalCost, 'NT$')}</p>
        <p>3. **匯率價差基礎 (現鈔比即期貴多少)**： ${cashRate.toFixed(4)} - ${spotRate.toFixed(4)} = **${rateDifference_positive.toFixed(4)}**</p>
        <p>4. **初算手續費 (公式 A)**： ${formatCurrency(finalAmount, '¥')} × ${rateDifference_positive.toFixed(4)} × 0.5 = <span class="result-value">${formatCurrency(feePreliminary_positive, 'NT$')}</span></p>
        ${feeNoteDetail}
        <p>5. **實際提領手續費 (預估)**： Max(初算, NT$${MIN_FEE}) = <span class="result-value">${formatCurrency(actualFee, 'NT$')}</span></p>
        <p>6. **總支出**： ${formatCurrency(totalOriginalCost, 'NT$')} + ${formatCurrency(actualFee, 'NT$')} = ${formatCurrency(totalExpense, 'NT$')}</p>
        <p>7. 攤提成本： ${formatCurrency(totalExpense, 'NT$')} ÷ ${formatCurrency(finalAmount, '¥')} = <span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>8. 台銀 Easy購總成本： ${formatCurrency(finalAmount, '¥')} × ${compareRate.toFixed(4)} = ${formatCurrency(externalCost, 'NT$')}</p>
        <p>9. 淨節省金額： ${formatCurrency(externalCost, 'NT$')} - ${formatCurrency(totalExpense, 'NT$')} = <span class="final-savings">${formatCurrency(savings, 'NT$')}</span></p>
    `;
    
    updateQuickDifference(cost, spotRate, cashRate, compareRate);
}

function copyResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    const disclaimer = document.getElementById('disclaimer'); 
    
    const amountInput = document.getElementById('amount');
    const finalAmount = parseFloat(amountInput.value);
    const { averageCost: cost, totalJPY: totalJPY, costTitle } = getAverageCost(); 
    
    // 判斷是否為多筆模式，調整複製的標題文字
    const amountLabel = amountInput.disabled ? 
        `提領金額 (已同步總買入): ${formatCurrency(finalAmount, '¥')}` : 
        `本次提領日圓金額: ${formatCurrency(finalAmount, '¥')}`;

    let fullText = `--- JPY Cost Calc 結算結果 (V2.26) 版權所有@gemini 設計者 zeroffa ---\n` +
                     `${amountLabel}\n` +
                     `總買入日圓金額: ${formatCurrency(totalJPY, '¥')}\n` + 
                     `**${costTitle}**: ${cost.toFixed(6)} NTD/JPY\n` + 
                     `即期匯率: ${document.getElementById('spotRate').value} / 現鈔匯率: ${document.getElementById('cashRate').value}\n` +
                     `外部結匯比較匯率: ${document.getElementById('compareRate').value} NTD/JPY\n` +
                     `================================\n` +
                     disclaimer.innerText + '\n' + 
                     resultsContainer.innerText;

    fullText += '\n\n【詳細計算過程】(台幣金額已四捨五入至整數)\n' + detailCalculation.innerText + '\n\n' + quickDifference.innerText;
    fullText += '\n\n--- 頁尾免責聲明 ---\n' + disclaimer.innerText; 

    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText).then(() => alert('複製成功！'));
    } else {
        alert('複製功能不支援此瀏覽器');
    }
}

// 初始化
function setupEventListeners() {
    const inputIds = ['amount', 'spotRate', 'cashRate', 'compareRate'];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateCost);
    });

    document.getElementById('spotRate').value = '0.1993'; 
    document.getElementById('cashRate').value = '0.2002';

    if (costInputCounter === 0) { 
        addCostInput(250000, 0.1989, true); 
    }

    const detailContent = document.getElementById('detailCalculation');
    const quickContent = document.getElementById('quickDifference');
    if (detailContent) detailContent.style.display = 'none';
    if (quickContent) quickContent.style.display = 'none';
    
    document.getElementById('toggleDetailBtn').innerText = '點此顯示';
    document.getElementById('toggleQuickBtn').innerText = '點此顯示';
    
    calculateCost();
}

window.onload = setupEventListeners;
