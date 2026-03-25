function toggleHistory() {
    // 1. 动画锁：如果正在播放抽卡过场动画，严禁打断
    if (typeof isAnimating !== 'undefined' && isAnimating) {
        return;
    }
    const modal = document.getElementById('history-modal');
    const homeScreen = document.getElementById('home-screen');
    // 2. 场景锁：判断当前是否在主页面
    // 如果主页面的 display 被设为 'none'（说明正在抽卡结算页或单卡回看页），
    // 且历史面板本身处于关闭状态，则触发“上锁”拦截
    if (homeScreen.style.display === 'none' && modal.style.display !== 'flex') {
        return;
    }
    // 3. 正常的面板开关逻辑
    if (modal.style.display === 'none' || modal.style.display === '') {
        renderHistory();
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function renderHistory() {
    const listContainer = document.getElementById('history-list');
    const historyData = JSON.parse(localStorage.getItem('cryptoGachaHistory') || '[]');
    
    if (historyData.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color: #6a7a94; padding: 30px;">暂无投递记录 / NO DATA FOUND</div>';
        return;
    }

    listContainer.innerHTML = historyData.map(record => {
        const date = new Date(record.timestamp).toLocaleString();
        
        const itemsHtml = record.items.map(item => `
            <div class="history-item rarity-${item.rarity}" 
                style="cursor: pointer; transition: all 0.2s;"
                onclick="viewHistoryCard('${item.name}', ${item.rarity})">
                [${item.path}] ${item.name} (${'★'.repeat(item.rarity)})
            </div>
        `).join('');

        return `
            <div class="history-record">
                <div class="history-record-time">${date} | 累计投递: ${record.totalPulls}</div>
                <div class="history-items">${itemsHtml}</div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    if (confirm("确定要清空所有投递记录吗？\n（这不会重置你的算力和保底进度）")) {
        localStorage.removeItem('cryptoGachaHistory');
        renderHistory();
    }
}

function viewHistoryCard(itemName, rarity) {
    const pool = POOLS[rarity];
    const fullItemData = pool.find(item => item.name === itemName);
    
    if (!fullItemData) {
        console.error("找不到该物品的数据：", itemName);
        return;
    }

    const historyModal = document.getElementById('history-modal');
    historyModal.style.display = 'none';
    document.getElementById('home-screen').style.display = 'none';

    const singleScreen = document.getElementById('single-result-screen');
    document.getElementById('skip-btn').style.display = 'none'; 
    document.getElementById('close-btn').style.display = 'none'; 

    renderSingle({ ...fullItemData, rarity: parseInt(rarity) }, singleScreen, false);

    setTimeout(() => {
        singleScreen.onclick = (e) => {
            if (e.target.id === 'skip-btn') return;
            
            singleScreen.removeEventListener('mousemove', handleCardParallax);
            if (typeof currentParticles !== 'undefined' && currentParticles) {
                currentParticles.destroy();
                currentParticles = null;
            }
            
            singleScreen.style.display = 'none';
            document.getElementById('home-screen').style.display = 'flex';
            historyModal.style.display = 'flex';
            
            singleScreen.onclick = null;
        };
    }, 50); 
}