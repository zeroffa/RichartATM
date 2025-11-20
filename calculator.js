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
 * V2.8 修復：設定快速金額按鈕的值，並確保立即觸發計算。
 * @param {number} value 要設定的日圓金額
 */
function setAmount(value) {
    const amountInput = document.getElementById('amount');
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

// 切換內容顯示/隱藏的函數
function toggleContent(contentId) {
    const content = document.getElementById(contentId);
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block'; 
    } else {
        content.style.display = 'none';
    }
}

// V2.15 新增：動態新增一組成本輸入框
function addCostInput(jpyAmount = 50000, rate = 0.1989) {
    const container = document.getElementById('costInputsContainer');
    const id = costInputCounter++;
    
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
    removeButton.onclick = () => removeCostInput(id);

    div.appendChild(amountInput);
    div.appendChild(rateInput);
    div.appendChild(removeButton);
    
    container.appendChild(div);

    // 每次新增後立即計算
    calculateCost();
}

// V2.15 新增：移除一組成本輸入框
function removeCostInput(id) {
    const row = document.getElementById(`cost-row-${id}`);
    if (row) {
        row.remove();
        calculateCost(); // 移除後重新計算
    }
}

/**
 * V2.15 新增：計算所有買入紀錄的加權平均成本。
 * @returns {object} {averageCost: number, totalJPY: number}
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
    
    // 更新平均成本顯示區塊
    const displayElement = document.getElementById('averageCostDisplay');
    if (validRecords > 0) {
        // V2.15: 顯示總買進日圓金額和平均成本
        displayElement.innerHTML = `
            總買入日圓：${formatCurrency(totalJPY, '¥')} | 
            **加權平均成本**：<span style="color:#cc0000;">${averageCost.toFixed(6)}</span> NTD/JPY
        `;
    } else {
        displayElement.innerHTML = `請新增有效的日圓買入紀錄`;
    }

    // 回傳平均成本 (NaN 需在核心計算中處理)
    return { averageCost, totalJPY };
}


// 計算並更新速算區塊
function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    
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
        
        // V2.14：日圓和台幣都使用 formatCurrency，會自動移除小數點
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
    
    // V2.15 修正：顯示計算所使用的加權平均成本
    quickDifferenceElement.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【不同金額差價速算 (手續費攤提影響)】</p>
        <p style="font-size:0.8em;">(使用匯率：加權平均成本 **${cost.toFixed(6)}** / 即期 **${spotRate.toFixed(4)}** / 現鈔 **${cashRate.toFixed(4)}**)</p>
        ${tableHtml}
    `;
}


// 核心計算函數
function calculateCost() {
    const amount = parseFloat(document.getElementById('amount').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 
    
    // V2.15 變更：取得加權平均成本
    const { averageCost: cost, totalJPY: totalJPY } = getAverageCost();
    
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    // 簡單的輸入驗證 (需檢查平均成本是否有效)
    if (isNaN(amount) || amount <= 0 || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate)) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查提領金額及所有匯率/成本數值是否正確填寫。</p>`;
        detailCalculation.innerHTML = '<p style="color:red;">請先填寫正確匯率及至少一筆有效的買入成本紀錄。</p>';
        quickDifference.innerHTML = `<p style="color:red; font-size:0.9em;">請先填寫正確匯率及成本。</p>`;
        quickDifference.style.display = 'none'; 
        return;
    }

    // 確保速算區塊被顯示
    quickDifference.style.display = document.getElementById('toggleQuickBtn').innerText.includes('隱藏') ? 'block' : 'none';


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
    if (actualFee === MIN_FEE) {
        const difference = MIN_FEE - feePreliminary;
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額 ${formatCurrency(feePreliminary, 'NT$')} 低於 NT$${MIN_FEE}，故會收最低手續費。 (被多收 ${formatCurrency(difference, 'NT$')})</p>`;
    }

    // --- Richart 總成本計算 ---
    // V2.15 變更：使用加權平均成本
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
    // V2.15 變更：強調使用加權平均成本
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【詳細計算過程】</p>
        <p>1. **加權平均買入成本**： <span class="final-cost">${cost.toFixed(6)}</span> 台幣/日圓</p>
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
    const { averageCost: cost, totalJPY: totalJPY } = getAverageCost(); // V2.15 取得平均成本
    
    // 更新複製內容中的版本資訊
    let fullText = `--- JPY Cost Calc 結算結果 (V2.15) 版權所有@gemini 設計者 zeroffa ---\n` +
                     `提領日圓金額: ${formatCurrency(parseFloat(document.getElementById('amount').value), '¥')}\n` +
                     `總買入日圓金額: ${formatCurrency(totalJPY, '¥')}\n` + // V2.15 新增
                     `**加權平均買進成本**: ${cost.toFixed(6)} NTD/JPY\n` + // V2.15 變更
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
window.addCostInput = addCostInput; // V2.15 新增

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

    // V2.15：頁面載入時，預設新增一筆買入紀錄
    addCostInput(250000, 0.1989); 
    
    calculateCost();
}

// 頁面載入完成後執行
window.onload = setupEventListeners;
