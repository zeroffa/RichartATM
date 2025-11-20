// 預先定義的速算金額列表
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000, 100000, 200000, 300000];

// 計算 Richart 提領的單一總成本 (用於速算)
function calculateUnitCost(amount, cost, spotRate, cashRate) {
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const MIN_FEE = 100;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    
    // 返回總支出
    return totalExpense;
}


// **新增：計算並更新速算區塊**
function updateQuickDifference(cost, spotRate, cashRate, compareRate) {
    const quickDifferenceElement = document.getElementById('quickDifference');
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>提領金額 (JPY)</th>
                    <th>Richart 總成本 (NTD)</th>
                    <th>台銀 Easy購總成本 (NTD)</th>
                    <th>差價 (節省金額)</th>
                </tr>
            </thead>
            <tbody>
    `;

    QUICK_AMOUNTS.forEach(amount => {
        // 1. Richart 提領總支出
        const richartExpense = calculateUnitCost(amount, cost, spotRate, cashRate);
        
        // 2. 外部結匯總成本 (台銀 Easy購)
        const externalCost = amount * compareRate;
        
        // 3. 差價 (節省金額)
        const savings = externalCost - richartExpense;
        const diffClass = savings >= 0 ? 'positive-diff' : 'negative-diff';
        
        tableHtml += `
            <tr>
                <td>${amount.toLocaleString()}</td>
                <td>${richartExpense.toFixed(2)}</td>
                <td>${externalCost.toFixed(2)}</td>
                <td class="${diffClass}">${savings.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    quickDifferenceElement.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【不同金額差價速算】</p>
        <p style="font-size:0.8em;">(使用目前設定的匯率：即期 ${spotRate.toFixed(4)} / 現鈔 ${cashRate.toFixed(4)} / 買入成本 ${cost.toFixed(4)})</p>
        ${tableHtml}
    `;
}


// 核心計算函數
function calculateCost() {
    // 1. 獲取使用者輸入的數值
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
        detailCalculation.innerHTML = '';
        document.getElementById('quickDifference').innerHTML = `<p style="color:red; font-size:0.9em;">請先填寫正確匯率</p>`;
        return;
    }

    // --- Richart 手續費計算 ---
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const MIN_FEE = 100;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    // --- Richart 總成本計算 ---
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    const totalCostPerUnit = totalExpense / amount;

    // --- 外部結匯成本比較 ---
    const externalCost = amount * compareRate;
    const savings = externalCost - totalExpense;

    // 6. 更新簡要結果 (Results Container)
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${actualFee.toFixed(2)}</span> 台幣</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> NTD/JPY</p>
        <hr>
        <p>外部結匯總成本 (台銀 Easy購 ${compareRate.toFixed(4)})：<span class="result-value">${externalCost.toFixed(2)}</span> 台幣</p>
        <p><strong> Richart 提領節省金額：<span class="final-savings">${savings.toFixed(2)}</span> 台幣 (若為負值則表示較貴)</strong></p>
    `;

    // 7. 更新詳細計算過程 (Detail Calculation)
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【Richart 提領詳細計算】</p>
        <p>1. 原始換匯成本： ${amount.toFixed(0)} JPY × ${cost.toFixed(4)} NTD/JPY = ${(amount * cost).toFixed(2)} NTD</p>
        <p>2. 匯率差額： ${spotRate.toFixed(4)} (即期賣) - ${cashRate.toFixed(4)} (現鈔賣) = ${(spotRate - cashRate).toFixed(4)}</p>
        <p>3. 初算手續費： ${amount.toFixed(0)} JPY × ${(spotRate - cashRate).toFixed(4)} × 0.5 = ${feePreliminary.toFixed(2)} NTD</p>
        <p>4. 實際手續費： MAX(100, ${feePreliminary.toFixed(2)}) = ${actualFee.toFixed(2)} NTD</p>
        <p>5. **總支出**： ${totalOriginalCost.toFixed(2)} (原始成本) + ${actualFee.toFixed(2)} (手續費) = ${totalExpense.toFixed(2)} NTD</p>
        <p>6. 攤提成本： ${totalExpense.toFixed(2)} NTD ÷ ${amount.toFixed(0)} JPY = <span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> NTD/JPY</p>
        <hr>
        <p style="font-weight:bold; margin-bottom: 5px;">【台銀 Easy購比較計算】</p>
        <p>7. 台銀 Easy購總成本： ${amount.toFixed(0)} JPY × ${compareRate.toFixed(4)} = ${externalCost.toFixed(2)} NTD</p>
        <p>8. 節省金額： ${externalCost.toFixed(2)} (台銀) - ${totalExpense.toFixed(2)} (Richart) = <span class="final-savings">${savings.toFixed(2)}</span> NTD</p>
    `;
    
    // 8. 更新速算區
    updateQuickDifference(cost, spotRate, cashRate, compareRate);
}

// **複製結果內容到剪貼簿**
function copyResults() {
    // ... (此處代碼與 V1.4 相同，省略以保持簡潔，但實際檔案中需包含)
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    // 組合所有文字內容 (包含速算區)
    const resultsText = resultsContainer.innerText;
    const detailText = detailCalculation.innerText;
    const quickText = quickDifference.innerText;

    // 獲取輸入值以創建完整的複製內容
    const amount = document.getElementById('amount').value;
    const cost = document.getElementById('cost').value;
    const spotRate = document.getElementById('spotRate').value;
    const cashRate = document.getElementById('cashRate').value;
    const compareRate = document.getElementById('compareRate').value;

    const fullText = `--- JPY Cost Calc 結算結果 (V1.5) ---\n` +
                     `提領日圓金額: ${amount} JPY\n` +
                     `原始買進成本: ${cost} NTD/JPY\n` +
                     `即期匯率: ${spotRate} / 現鈔匯率: ${cashRate}\n` +
                     `台銀 Easy購比較匯率: ${compareRate} NTD/JPY\n` +
                     `================================\n` +
                     resultsText + '\n\n' + detailText + '\n\n' + quickText;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullText)
            .then(() => {
                alert('計算結果已複製到剪貼簿！');
            })
            .catch(err => {
                console.error('無法複製文字:', err);
                alert('複製失敗，請手動複製！');
            });
    } else {
        alert('您的瀏覽器不支援自動複製功能，請手動複製！');
    }
}


// 設定即時監聽事件 (無變動)
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

window.copyResults = copyResults;
window.onload = setupEventListeners;
