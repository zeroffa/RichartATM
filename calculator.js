// 預先定義的速算金額列表
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000];
const MIN_FEE = 100; // 最低手續費

/**
 * V2.6 新增：格式化數字為貨幣字串，包含千分位
 * @param {number} number 待格式化的數字
 * @param {string} currencySymbol 貨幣符號 (例如: '¥', '$', 'NT$')
 * @returns {string} 格式化後的字串
 */
function formatCurrency(number, currencySymbol) {
    if (isNaN(number)) return '';
    // 使用 toLocaleString 確保千分位分隔，並取小數點後兩位 (貨幣通常保留兩位)
    const formattedNumber = number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currencySymbol}${formattedNumber}`;
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
    
    // 如果目前是隱藏狀態 (display: none)，則切換為顯示 (display: block)
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
    } else {
        // 否則，切換為隱藏
        content.style.display = 'none';
    }
}


// 計算並更新速算區塊
function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>提領金額 (日圓)</th>
                    <th>Richart 總支出 (台幣)</th>
                    <th>台銀 Easy購總成本 (台幣)</th>
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
        
        // V2.6：使用 formatCurrency 格式化結果
        tableHtml += `
            <tr>
                <td>${formatCurrency(amount, '¥').replace('.00', '')}</td> 
                <td>${formatCurrency(richartExpense, 'NT$')}</td>
                <td>${formatCurrency(externalCost, 'NT$')}</td>
                <td class="${diffClass}">${formatCurrency(savings, 'NT$')}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    quickDifferenceElement.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【不同金額差價速算 (手續費攤提影響)】</p>
        <p style="font-size:0.8em;">(使用目前設定的匯率：即期 ${spotRate.toFixed(4)} / 現鈔 ${cashRate.toFixed(4)} / 買入成本 ${cost.toFixed(4)})</p>
        ${tableHtml}
    `;
}


// 核心計算函數
function calculateCost() {
    const amount = parseFloat(document.getElementById('amount').value);
    const cost = parseFloat(document.getElementById('cost').value);
    const spotRate = parseFloat(document.getElementById('spotRate').value);
    const cashRate = parseFloat(document.getElementById('cashRate').value);
    const compareRate = parseFloat(document.getElementById('compareRate').value); 

    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    
    // 簡單的輸入驗證
    if (isNaN(amount) || isNaN(cost) || isNaN(spotRate) || isNaN(cashRate) || isNaN(compareRate) || amount <= 0) {
        resultsContainer.innerHTML = `<p style="color:red;">請檢查所有數值輸入是否正確。</p>`;
        detailCalculation.innerHTML = '<p style="color:red;">請先填寫正確匯率</p>';
        document.getElementById('quickDifference').innerHTML = `<p style="color:red; font-size:0.9em;">請先填寫正確匯率</p>`;
        document.getElementById('quickDifference').style.display = 'none'; // 保持隱藏
        return;
    }

    // --- Richart 手續費計算 ---
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // 判斷是否被收最低手續費的文字提示 (用於簡要結果)
    let feeNoteSimple = ``;
    if (actualFee === MIN_FEE) {
        feeNoteSimple = `<span style="color:#cc0000; font-weight:bold; font-size:0.9em;"> (被收最低手續費 NT$${MIN_FEE})</span>`;
    }

    // 判斷是否被收最低手續費的文字提示 (用於詳細計算)
    let feeNoteDetail = ``;
    if (actualFee === MIN_FEE) {
        const difference = MIN_FEE - feePreliminary;
        feeNoteDetail = `<p style="margin-left: 10px; color:#cc0000; font-weight:bold;">→ 初算金額 ${formatCurrency(feePreliminary, 'NT$')} 低於 NT$${MIN_FEE}，故被收最低手續費。 (被多收 ${formatCurrency(difference, 'NT$')})</p>`;
    }

    // --- Richart 總成本計算 ---
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 更新簡要結果
    // V2.6：數值使用 formatCurrency 格式化
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${formatCurrency(actualFee, 'NT$')}</span> ${feeNoteSimple}</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>台銀 Easy購總成本 (匯率 ${compareRate.toFixed(4)})：<span class="result-value">${formatCurrency(externalCost, 'NT$')}</span></p>
        <p><strong> Richart 提領淨節省金額：<span class="final-savings">${formatCurrency(savings, 'NT$')}</span> (負值表示較貴)</strong></p>
    `;

    // 7. 更新詳細計算過程
    // V2.6：數值使用 formatCurrency 格式化
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【詳細計算過程】</p>
        <p>1. 原始換匯成本： ${formatCurrency(amount, '¥').replace('.00', '')} × ${cost.toFixed(4)} 台幣/日圓 = ${formatCurrency(totalOriginalCost, 'NT$')}</p>
        <p>2. 匯率差額： ${spotRate.toFixed(4)} (即期賣) - ${cashRate.toFixed(4)} (現鈔賣) = ${(spotRate - cashRate).toFixed(4)}</p>
        <p>3. **初算手續費**： ${formatCurrency(amount, '¥').replace('.00', '')} × ${(spotRate - cashRate).toFixed(4)} × 0.5 = <span class="result-value">${formatCurrency(feePreliminary, 'NT$')}</span></p>
        ${feeNoteDetail}
        <p>4. **實際手續費**： <span class="result-value">${formatCurrency(actualFee, 'NT$')}</span></p>
        <p>5. **總支出**： ${formatCurrency(totalOriginalCost, 'NT$')} (原始成本) + ${formatCurrency(actualFee, 'NT$')} (手續費) = ${formatCurrency(totalExpense, 'NT$')}</p>
        <p>6. 攤提成本： ${formatCurrency(totalExpense, 'NT$')} ÷ ${formatCurrency(amount, '¥').replace('.00', '')} = <span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p style="font-weight:bold; margin-bottom: 5px;">【台銀 Easy購比較計算】</p>
        <p>7. 台銀 Easy購總成本： ${formatCurrency(amount, '¥').replace('.00', '')} × ${compareRate.toFixed(4)} = ${formatCurrency(externalCost, 'NT$')}</p>
        <p>8. 淨節省金額： ${formatCurrency(externalCost, 'NT$')} (台銀) - ${formatCurrency(totalExpense, 'NT$')} (Richart) = <span class="final-savings">${formatCurrency(savings, 'NT$')}</span></p>
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
    
    let fullText = `--- JPY Cost Calc 結算結果 (V2.8) ---\n` +
                     `提領日圓金額: ¥${parseFloat(document.getElementById('amount').value).toLocaleString('zh-TW')}\n` +
                     `原始買進成本: ${document.getElementById('cost').value} NTD/JPY\n` +
                     `即期匯率: ${document.getElementById('spotRate').value} / 現鈔匯率: ${document.getElementById('cashRate').value}\n` +
                     `外部結匯比較匯率 (Easy購/其他): ${document.getElementById('compareRate').value} NTD/JPY\n` +
                     `================================\n` +
                     disclaimer.innerText + '\n' + 
                     resultsContainer.innerText;

    // 無論是否摺疊，都複製詳細內容
    fullText += '\n\n【詳細計算過程】\n' + detailCalculation.innerText + '\n\n' + quickDifference.innerText;
    
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


// 將函數暴露給 HTML 呼叫 (V2.8: 提前定義，確保按鈕能找到它)
window.copyResults = copyResults;
window.toggleContent = toggleContent; 
window.setAmount = setAmount; 


// 設定即時監聽事件
function setupEventListeners() {
    const inputIds = ['amount', 'cost', 'spotRate', 'cashRate', 'compareRate'];
    
    inputIds.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener('input', calculateCost);
        }
    });

    calculateCost();
}

// 頁面載入完成後執行
window.onload = setupEventListeners;
