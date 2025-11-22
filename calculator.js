// 預先定義的速算金額列表
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000];
const MIN_FEE = 100; // 最低手續費
let costInputCounter = 0; // 用於給每筆買入紀錄一個唯一的 ID

/**
 * V2.14 修正：格式化數字為貨幣字串，NT$ 和 ¥ 都只顯示整數 (NT$ 四捨五入)。
 * @param {number} number 待格式化的數字
 * @param {string} currencySymbol 貨幣符號 (例如: '¥', '$', 'NT$')
 * @returns {string} 格式化後的字串
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
 * V2.20 修正：設定快速金額按鈕的值，並加入多筆成本計算時的警告。
 * @param {number} value 要設定的日圓金額
 * @param {boolean} fromQuickButton 是否從快速按鈕觸發
 */
function setAmount(value, fromQuickButton = false) {
    const amountInput = document.getElementById('amount');
    
    // 檢查目前是否有超過一筆的買入成本紀錄
    const recordCount = document.querySelectorAll('.cost-input-row').length;
    
    if (fromQuickButton && recordCount > 1) {
        alert("【多筆日幣計算中】\n\n警告：您目前有多筆買入紀錄，正在計算加權平均成本。\n\n此快速按鈕僅更改上方的「本次提領日圓金額」，您的多筆買入成本紀錄不會被影響。");
    }

    amountInput.value = value;
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

/**
 * V2.21 修正：切換內容顯示/隱藏的函數，並同時更改按鈕文字
 * @param {string} contentId 內容區塊的 ID
 * @param {string} buttonId 切換按鈕的 ID
 */
function toggleContent(contentId, buttonId) {
    const content = document.getElementById(contentId);
    const button = document.getElementById(buttonId);
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        if (button) {
            button.innerText = '點此隱藏';
        } 
    } else {
        content.style.display = 'none';
        if (button) {
            button.innerText = '點此顯示';
        }
    }
}

/**
 * V2.18 修正：動態新增一組成本輸入框
 * @param {number} jpyAmount 日圓金額預設值
 * @param {number} rate 買進成本預設值
 * @param {boolean} isDefault 是否為初始的第一筆紀錄 
 */
function addCostInput(jpyAmount = 50000, rate = 0.1989, isDefault = false) {
    const container = document.getElementById('costInputsContainer');
    const id = costInputCounter++;

    // V2.18 修正：只有在初始化時 (isDefault = true)，才清空容器並加入標題
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
    
    // 日圓金額輸入框 (¥)
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.value = jpyAmount;
    amountInput.step = 1;
    amountInput.min = 0;
    amountInput.className = 'cost-jpy-amount label-jpy';
    amountInput.addEventListener('input', calculateCost); 

    // 買進成本輸入框 (NTD/JPY)
    const rateInput = document.createElement('input');
    rateInput.type = 'number';
    rateInput.value = rate;
    rateInput.step = 0.0001;
    rateInput.className = 'cost-rate-value label-rate';
    rateInput.addEventListener('input', calculateCost); 

    // 刪除按鈕
    const removeButton = document.createElement('button');
    removeButton.innerHTML = '&times;';
    removeButton.title = '刪除此筆紀錄';
    removeButton.className = 'remove-btn'; 
    removeButton.onclick = () => removeCostInput(id);

    div.appendChild(amountInput);
    div.appendChild(rateInput);
    div.appendChild(removeButton);
    
    // V2.18 修正：只有預設的第一筆紀錄 (id=0, 且是初始化時呼叫) 隱藏刪除按鈕
    if (isDefault && id === 0) {
        removeButton.style.visibility = 'hidden'; 
    } else {
        removeButton.style.visibility = 'visible';
    }
    
    container.appendChild(div);

    // 每次新增後立即計算
    calculateCost(); 
}

// V2.18 修正：移除一組成本輸入框
function removeCostInput(id) {
    const row = document.getElementById(`cost-row-${id}`);
    const container = document.getElementById('costInputsContainer');
    
    // 扣掉頂部的標題行
    const rows = container.querySelectorAll('.cost-input-row');
    
    // 確保至少保留一筆紀錄
    if (row && rows.length > 1) { 
        row.remove();
        calculateCost(); // 移除後重新計算
        
        // V2.18: 如果只剩下一筆，隱藏它的刪除按鈕
        const remainingRows = container.querySelectorAll('.cost-input-row');
        if (remainingRows.length === 1) {
             remainingRows[0].querySelector('.remove-btn').style.visibility = 'hidden';
        }

    } else if (rows.length === 1) {
        alert("必須至少保留一筆日圓買入成本紀錄。");
    }
}

/**
 * V2.17/V2.20 修正：計算所有買入紀錄的加權平均成本，並根據筆數調整顯示名稱和顏色。
 * @returns {object} {averageCost: number, totalJPY: number, recordCount: number}
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
        
        // 確保兩者皆為有效數字且日圓金額大於 0
        if (!isNaN(jpy) && jpy > 0 && !isNaN(rate) && rate > 0) {
            totalJPY += jpy;
            totalNTD += jpy * rate;
            validRecords++;
        }
    });

    const averageCost = totalJPY > 0 ? (totalNTD / totalJPY) : NaN;
    
    // 動態調整標題
    const titleElement = document.getElementById('costInputTitle');
    const displayElement = document.getElementById('averageCostDisplay');
    let costTitle = "單一買進成本";
    
    if (validRecords > 1) {
        costTitle = "加權平均成本";
        // V2.18: 修正提示文字
        titleElement.innerHTML = `日圓買入成本紀錄 (分批買入計算**加權平均成本**) <span class="default-hint">(請輸入您手上所有日圓的買入紀錄)</span>`;
    } else {
        costTitle = "單一買進成本";
        // V2.18: 修正提示文字
        titleElement.innerHTML = `日圓買入成本紀錄 (預設單一成本) <span class="default-hint">(如有多筆，請按下方按鈕新增)</span>`;
    }

    if (validRecords > 0) {
        // V2.20 修正：將總買入日圓的數值改為紅色
        displayElement.innerHTML = `
            總買入日圓：<span style="color:#cc0000;">${formatCurrency(totalJPY, '¥')}</span> | 
            **${costTitle}**：<span style="color:#cc0000;">${averageCost.toFixed(6)}</span> NTD/JPY
        `;
    } else {
        displayElement.innerHTML = `請新增有效的日圓買入紀錄`;
    }

    // 回傳結果
    return { averageCost, totalJPY, recordCount: validRecords, costTitle };
}


// 計算並更新速算區塊
function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    const { costTitle } = getAverageCost(); // V2.18 取得成本名稱
    
    // 檢查平均成本是否有效，無效則不顯示速算
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
    
    // V2.18 修正：顯示計算所使用的成本名稱
    quickDifferenceElement.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【不同金額差價速算 (手續費攤提影響)】</p>
        <p style="font-size:0.8em;">(使用匯率：${costTitle} **${cost.toFixed(6)}** / 即期 **${spotRate.toFixed(4)}** / 現鈔 **${cashRate.toFixed(4)}**)</p>
        ${tableHtml}
    `;
    
    // V2.21 修正：移除計算時強制顯示 quickDifference 的邏輯，讓它保持被 toggle 的狀態
}


// 核心計算函數
function calculateCost() {
    const amount = parseFloat(document.getElementById('amount').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 
    
    // V2.17 變更：取得加權平均成本及其名稱
    const { averageCost: cost, totalJPY: totalJPY, costTitle } = getAverageCost();
    
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    // 簡單的輸入驗證 (需檢查平均成本是否有效)
    if (isNaN(amount) || amount <= 0 || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate)) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查提領金額及所有匯率/成本數值是否正確填寫。</p>`;
        detailCalculation.innerHTML = '<p style="color:red;">請先填寫正確匯率及至少一筆有效的買入成本紀錄。</p>';
        quickDifference.innerHTML = `<p style="color:red; font-size:0.9em;">請先填寫正確匯率及成本。</p>`;
        // V2.21 修正：在無效時，確保這兩個區塊仍為隱藏
        detailCalculation.style.display = 'none';
        quickDifference.style.display = 'none'; 
        return;
    }

    // V2.21 修正：移除計算時對 toggle 狀態的檢查和設定，讓它保持被 toggle 的狀態
    
    // --- Richart 手續費計算 ---
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // 判斷是否會收最低手續費的文字提示 (用於簡要結果)
    let feeNoteSimple = ``;
    if (actualFee === MIN_FEE) {
        feeNoteSimple = `<span style="color:#cc0000; font-weight:bold; font-size:0.9em;"> (會收最低手續費 NT$${MIN_FEE})</span>`;
    }

    // 判斷是否會收最低手續費的文字提示 (用於詳細計算)
    let feeNoteDetail = ``;
    // V2.20 修正：處理即期 < 現鈔時 feePreliminary 為負數的情況
    if (feePreliminary < 0) {
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額為負值，但根據規定，最低仍會收取 NT$${MIN_FEE} 手續費。</p>`;
    } else if (actualFee === MIN_FEE) {
        const difference = MIN_FEE - feePreliminary;
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額 ${formatCurrency(feePreliminary, 'NT$')} 低於 NT$${MIN_FEE}，故會收最低手續費。 (被多收 ${formatCurrency(difference, 'NT$')})</p>`;
    }


    // --- Richart 總成本計算 ---
    const totalOriginalCost = amount * cost; 
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 更新簡要結果
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${formatCurrency(actualFee, 'NT$')}</span> ${feeNoteSimple}</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>台銀 Easy購總成本 (匯率 ${compareRate.toFixed(4)})：<span class="result-value">${formatCurrency(externalCost, 'NT$')}</span></p>
        <p><strong> Richart 提領淨節省金額：<span class="final-savings">${formatCurrency(savings, 'NT$')}</span> (負值表示較貴)</strong></p>
    `;

    // 7. 更新詳細計算過程
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【詳細計算過程】</p>
        <p>1. **${costTitle}**： <span class="final-cost">${cost.toFixed(6)}</span> 台幣/日圓</p>
        <p>2. 原始換匯成本： ${formatCurrency(amount, '¥')} × ${cost.toFixed(6)} (平均成本) = ${formatCurrency(totalOriginalCost, 'NT$')}</p>
        <p>3. 匯率差額： ${spotRate.toFixed(4)} (即期賣) - ${cashRate.toFixed(4)} (現鈔賣) = ${(spotRate - cashRate).toFixed(4)}</p>
        <p>4. **初算手續費**： ${formatCurrency(amount, '¥')} × ${(spotRate - cashRate).toFixed(4)} × 0.5 = <span class="result-value">${formatCurrency(feePreliminary, 'NT$')}</span></p>
        ${feeNoteDetail}
        <p>5. **實際手續費**： <span class="result-value">${formatCurrency(actualFee, 'NT$')}</span></p>
        <p>6. **總支出**： ${formatCurrency(totalOriginalCost, 'NT$')} (原始成本) + ${formatCurrency(actualFee, 'NT$')} (手續費) = ${formatCurrency(totalExpense, 'NT$')}</p>
        <p>7. 攤提成本： ${formatCurrency(totalExpense, 'NT$')} ÷ ${formatCurrency(amount, '¥')} = <span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p style="font-weight:bold; margin-bottom: 5px;">【台銀 Easy購比較計算】</p>
        <p>8. 台銀 Easy購總成本： ${formatCurrency(amount, '¥')} × ${compareRate.toFixed(4)} = ${formatCurrency(externalCost, 'NT$')}</p>
        <p>9. 淨節省金額： ${formatCurrency(externalCost, 'NT$')} (台銀) - ${formatCurrency(totalExpense, 'NT$')} (Richart) = <span class="final-savings">${formatCurrency(savings, 'NT$')}</span></p>
    `;
    
    // 8. 更新速算區
    updateQuickDifference(cost, spotRate, cashRate, compareRate);
}

// 複製所有計算內容
function copyResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    const disclaimer = document.getElementById('disclaimer'); 
    // V2.17 取得加權平均成本及其名稱
    const { averageCost: cost, totalJPY: totalJPY, costTitle } = getAverageCost(); 
    
    // 更新複製內容中的版本資訊
    let fullText = `--- JPY Cost Calc 結算結果 (V2.21) 版權所有@gemini 設計者 zeroffa ---\n` +
                     `提領日圓金額: ${formatCurrency(parseFloat(document.getElementById('amount').value), '¥')}\n` +
                     `總買入日圓金額: ${formatCurrency(totalJPY, '¥')}\n` + 
                     `**${costTitle}**: ${cost.toFixed(6)} NTD/JPY\n` + 
                     `即期匯率: ${document.getElementById('spotRate').value} / 現鈔匯率: ${document.getElementById('cashRate').value}\n` +
                     `外部結匯比較匯率 (Easy購/其他): ${document.getElementById('compareRate').value} NTD/JPY\n` +
                     `================================\n` +
                     disclaimer.innerText + '\n' + 
                     resultsContainer.innerText;

    // 無論是否摺疊，都複製詳細內容
    fullText += '\n\n【詳細計算過程】(台幣金額已四捨五入至整數)\n' + detailCalculation.innerText + '\n\n' + quickDifference.innerText;
    
    // 在底部再加一次免責聲明 (讓複製的文字檔更完整)
    fullText += '\n\n--- 頁尾免責聲明 ---\n' + disclaimer.innerText; 


    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText)
            .then(() => {
                alert('所有計算結果已複製到剪貼簿！');
            })
            .catch(err => {
                console.error('無法複製文字:', err);
                alert('複製失敗，請手動複製！');
            });
    } else {
        alert('您的瀏覽器不支援自動複製功能，請手動複製！');
    }
}


// 將函數暴露給 HTML 呼叫
window.copyResults = copyResults;
window.toggleContent = toggleContent; 
window.setAmount = setAmount; 
window.addCostInput = addCostInput;
window.removeCostInput = removeCostInput; 


// 設定即時監聽事件
function setupEventListeners() {
    // 提領金額和匯率監聽
    const inputIds = ['amount', 'spotRate', 'cashRate', 'compareRate'];
    inputIds.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('input', calculateCost);
        }
    });

    // V2.20 修正：將匯率輸入框的值設定為新的預設值
    document.getElementById('spotRate').value = '0.1993'; 
    document.getElementById('cashRate').value = '0.2002';

    // V2.18 修正：確保只在初始化時新增預設紀錄
    if (costInputCounter === 0) { 
        // 傳遞 true 表示這是初始化時的預設紀錄
        addCostInput(250000, 0.1989, true); 
    }

    // V2.21 修正：在頁面載入時，將詳細計算和速算區塊預設為隱藏
    const detailContent = document.getElementById('detailCalculation');
    const quickContent = document.getElementById('quickDifference');
    
    if (detailContent) detailContent.style.display = 'none';
    if (quickContent) quickContent.style.display = 'none';
    
    // 確保按鈕文字也是「點此顯示」
    const detailButton = document.getElementById('toggleDetailBtn');
    const quickButton = document.getElementById('toggleQuickBtn');
    
    if (detailButton) detailButton.innerText = '點此顯示';
    if (quickButton) quickButton.innerText = '點此顯示';
    
    // 初始計算會在 addCostInput 內部調用，這裡再次呼叫確保所有欄位都被初始化
    calculateCost();
}

// 頁面載入完成後執行
window.onload = setupEventListeners;
