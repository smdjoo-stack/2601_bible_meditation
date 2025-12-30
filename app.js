document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const listContainer = document.getElementById('meditation-list');
    const dailyView = document.getElementById('daily-view');
    const dailyContent = document.getElementById('daily-content-container');
    const dashboardView = document.getElementById('dashboard-view');
    
    // State
    let currentDayIndex = 0;

    function init() {
        renderList();
        checkUrlParams();
    }

    function renderList() {
        listContainer.innerHTML = '';
        
        // Populate based on meditationData from data.js
        meditationData.forEach((data, index) => {
            const dateObj = new Date(data.date);
            const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
            
            // Random Image for thumbnail (deterministic based on index)
            const imgIndex = (index % 5) + 1; 
            const imgUrl = `https://source.unsplash.com/random/100x100?nature,${imgIndex}`; 
            // Better placeholder since unsplash source might be slow/deprecated:
            // Using a simple colored box or gradient in CSS if image fails, but let's try a predictable one:
            const thumbUrl = `https://images.unsplash.com/photo-${[
                '1499002238440-d264edd596ec', 
                '1470252649378-9c29740c9ae8', 
                '1446776811953-b23d57bd21aa', 
                '1500964757637-c85e8a162699',
                '1426604966848-d124769883c7'
            ][index % 5]}?w=100&h=100&fit=crop`;

            const item = document.createElement('div');
            item.className = 'list-item';
            item.onclick = () => showDailyView(index);
            
            item.innerHTML = `
                <div class="item-thumb" style="background-image: url('${thumbUrl}');">
                    ${dateObj.getDate()}
                </div>
                <div class="item-info">
                    <div class="item-header">
                        <span class="font-bold text-primary">${dateStr}</span>
                        <span class="status-tag">완료</span>
                    </div>
                    <h3 class="font-bold truncate" style="margin-bottom: 0.1rem;">${data.title}</h3>
                    <p class="text-secondary text-xs truncate">${data.scripture}</p>
                </div>
                <span class="material-symbols-outlined text-secondary" style="font-size: 20px;">chevron_right</span>
            `;
            
            listContainer.appendChild(item);
        });
    }

    window.openToday = function() { // Exposed to global for the featured card button
        // Logic to find today's date, or defaults to first available
        // For Jan 2026, let's just open the first one for now as 'continuing'
        showDailyView(0);
    };

    window.showDailyView = function(index) {
        currentDayIndex = index;
        const data = meditationData[index];
        
        // Update Content
        renderDailyContent(data);
        
        // Show View
        dailyView.style.display = 'block';
        // Disable body scroll on background?
        document.body.style.overflow = 'hidden';
        
        // URL Update
        const newUrl = `${window.location.pathname}?day=${data.day}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    window.closeDailyView = function() {
        dailyView.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
        
        // Reset URL
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    function renderDailyContent(data) {
        const dateObj = new Date(data.date);
        const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

        let html = `
            <div class="daily-header">
                <div class="daily-date">${dateStr}</div>
                <h1 class="daily-title">${data.title}</h1>
                <div class="day-scripture-ref">${data.scripture}</div>
            </div>
            
            <div class="section-card">
                 <div class="section-title">말씀 본문</div>
                 <div class="verse-text">
        `;

        // Video
        if (data.bibleReadingVideoUrl) {
            let videoId = '';
            if (data.bibleReadingVideoUrl.includes('v=')) {
                videoId = data.bibleReadingVideoUrl.split('v=')[1].split('&')[0];
            } else if (data.bibleReadingVideoUrl.includes('youtu.be/')) {
                videoId = data.bibleReadingVideoUrl.split('youtu.be/')[1];
            }
            if (videoId) {
                html += `
                    <div class="video-section">
                        <div class="video-container">
                            <iframe src="https://www.youtube.com/embed/${videoId}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                `;
            }
        }

        // Scripture Text
        data.scriptureText.forEach(verse => {
            html += `<div class="verse"><span class="verse-num">${verse.verse}</span>${verse.text}</div>`;
        });
        html += `</div></div>`;

        // Summary
        html += `
            <div class="section-card">
                <h2 class="section-title">오늘의 요약</h2>
                <div class="text-content text-secondary">${data.summary}</div>
            </div>
        `;

        // Exposition
        html += `<div class="section-card"><h2 class="section-title">본문 해설</h2>`;
        data.expositions.forEach(exp => {
            html += `
                <div style="margin-bottom: 1.5rem;">
                    <h3 class="text-primary font-bold" style="margin-bottom:0.5rem;">${exp.title}</h3>
                    <div class="text-content text-secondary">${exp.content}</div>
                    ${exp.questions && exp.questions.length > 0 ? `
                        <div class="questions-box">
                            ${exp.questions.map(q => `<div class="question-item"><span class="material-symbols-outlined" style="font-size:16px;">edit</span> ${q}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += `</div>`;

        // Prayer
        html += `
            <div class="section-card">
                <h2 class="section-title">오늘의 기도</h2>
                <div class="text-content text-secondary" style="font-style: italic;">${data.prayer}</div>
            </div>
        `;

        // Essay
        html += `
             <div class="section-card">
                <h2 class="section-title">묵상 에세이</h2>
                <div class="text-content text-secondary">${data.essay.content}</div>
            </div>
        `;

        // One Verse
        html += `
            <div class="section-card" style="background: var(--primary-color); color: white;">
                <div class="section-title" style="color: white; border-color: rgba(255,255,255,0.5);">한절 묵상</div>
                <div style="opacity: 0.8; margin-bottom: 0.5rem; font-size: 0.9rem;">${data.oneVerse.verse}</div>
                <div class="text-content" style="color: white;">${data.oneVerse.content}</div>
            </div>
        `;

        dailyContent.innerHTML = html;
        dailyContent.parentElement.scrollTo(0, 0);
    }

    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const dayParam = urlParams.get('day');
        if (dayParam) {
            const index = meditationData.findIndex(d => d.day === parseInt(dayParam));
            if (index !== -1) showDailyView(index);
        }
    }

    // Handle Back Button
    window.addEventListener('popstate', (event) => {
        const urlParams = new URLSearchParams(window.location.search);
         if (!urlParams.get('day')) {
             dailyView.style.display = 'none';
             document.body.style.overflow = '';
         } else {
             checkUrlParams();
         }
    });

    init();
});
