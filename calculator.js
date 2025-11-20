// 預先定義的速算金額列表
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000, 100000, 200000, 300000];

// 計算 Richart 提領的單一總成本 (用於速算)
function calculateUnitCost(amount, cost, spotRate, cashRate) {
    const feePreliminary = amount * (spotRate - cashRate) * 0.5;
    const MIN_FEE = 100;
    const actualFee = Math.max(MIN_FEE, feePreliminary);
    
    const totalOriginalCost = amount * cost;
    const totalExpense = totalOriginalCost + actualFee;
    
    return totalExpense;
}


// **新增：切換內容顯示/隱藏的函數**
function toggleContent(contentId, buttonId) {
    const content = document.getElementById(contentId);
    
    // 檢查目前狀態 (使用 display 屬性)
    if (content.style.display === 'block') {
        content.style.display = 'none';
    } else {
        content.style.display = 'block';
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
        
        tableHtml += `
            <tr>
                <td>${amount.toLocaleString('zh-TW')}</td>
                <td>${richartExpense.toFixed(2)}</td>
                <td>${externalCost.toFixed(2)}</td>
                <td class="${diffClass}">${savings.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    quickDifferenceElement.innerHTML = `
        <p style="font-size:0.8em;">(使用目前設定的匯率：即期 ${spotRate.toFixed(4)} / 現鈔 ${cashRate.toFixed(4)} / 買入成本 ${cost.toFixed(4)})</p>
        ${tableHtml}
    `;
    
    // 初始化時設置為隱藏
    quickDifferenceElement.style.display = 'none';
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
        detailCalculation.innerHTML = '';
        document.getElementById('quickDifference').innerHTML = `<p style="color:red; font-size:0.9em;">請先填寫正確匯率</p>`;
        // 確保錯誤時也隱藏
        detailCalculation.style.display = 'none';
        document.getElementById('quickDifference').style.display = 'none';
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

    // 6. 更新簡要結果
    resultsContainer.innerHTML = `
        <p>實際提領手續費：<span class="result-value">${actualFee.toFixed(2)}</span> 台幣</p>
        <p>納入手續費後，日圓**單位總成本**：<span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p>台銀 Easy購總成本 (匯率 ${compareRate.toFixed(4)})：<span class="result-value">${externalCost.toFixed(2)}</span> 台幣</p>
        <p><strong> Richart 提領淨節省金額：<span class="final-savings">${savings.toFixed(2)}</span> 台幣 (負值表示較貴)</strong></p>
    `;

    // 7. 更新詳細計算過程
    detailCalculation.innerHTML = `
        <p style="font-weight:bold; margin-bottom: 5px;">【Richart 提領詳細計算】</p>
        <p>1. 原始換匯成本： ${amount.toFixed(0)} 日圓 × ${cost.toFixed(4)} 台幣/日圓 = ${(amount * cost).toFixed(2)} 台幣</p>
        <p>2. 匯率差額： ${spotRate.toFixed(4)} (即期賣) - ${cashRate.toFixed(4)} (現鈔賣) = ${(spotRate - cashRate).toFixed(4)}</p>
        <p>3. 初算手續費： ${amount.toFixed(0)} 日圓 × ${(spotRate - cashRate).toFixed(4)} × 0.5 = ${feePreliminary.toFixed(2)} 台幣</p>
        <p>4. 實際手續費： MAX(100, ${feePreliminary.toFixed(2)}) = ${actualFee.toFixed(2)} 台幣</p>
        <p>5. **總支出**： ${totalOriginalCost.toFixed(2)} (原始成本) + ${actualFee.toFixed(2)} (手續費) = ${totalExpense.toFixed(2)} 台幣</p>
        <p>6. 攤提成本： ${totalExpense.toFixed(2)} 台幣 ÷ ${amount.toFixed(0)} 日圓 = <span class="final-cost">${totalCostPerUnit.toFixed(6)}</span> 台幣/日圓</p>
        <hr>
        <p style="font-weight:bold; margin-bottom: 5px;">【台銀 Easy購比較計算】</p>
        <p>7. 台銀 Easy購總成本： ${amount.toFixed(0)} 日圓 × ${compareRate.toFixed(4)} = ${externalCost.toFixed(2)} 台幣</p>
        <p>8. 淨節省金額： ${externalCost.toFixed(2)} (台銀) - ${totalExpense.toFixed(2)} (Richart) = <span class="final-savings">${savings.toFixed(2)}</span> 台幣</p>
    `;
    
    // 8. 更新速算區
    updateQuickDifference(cost, spotRate, cashRate, compareRate);
}

// **複製所有計算內容**
function copyResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const detailCalculation = document.getElementById('detailCalculation');
    const quickDifference = document.getElementById('quickDifference');
    
    // 組合所有文字內容，包括隱藏的詳細計算和速算區
    let fullText = `--- JPY Cost Calc 結算結果 (V1.6) ---\n` +
                     `提領日圓金額: ${document.getElementById('amount').value} JPY\n` +
                     `原始買進成本: ${document.getElementById('cost').value} NTD/JPY\n` +
                     `即期匯率: ${document.getElementById('spotRate').value} / 現鈔匯率: ${document.getElementById('cashRate').value}\n` +
                     `台銀 Easy購比較匯率: ${document.getElementById('compareRate').value} NTD/JPY\n` +
                     `================================\n` +
                     resultsContainer.innerText;

    // 複製時直接加入詳細計算和速算區的內容，無需檢查是否隱藏
    fullText += '\n\n【詳細計算過程】\n' + detailCalculation.innerText + '\n\n【不同金額差價速算】\n' + quickDifference.innerText;

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

// 將函數暴露給 HTML 呼叫
window.toggleContent = toggleContent;
window.copyResults = copyResults;
window.onload = setupEventListeners;
