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

    window.openToday = function () { // Exposed to global for the featured card button
        // Logic to find today's date, or defaults to first available
        // For Jan 2026, let's just open the first one for now as 'continuing'
        showDailyView(0);
    };

    window.showDailyView = function (index) {
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

    window.closeDailyView = function () {
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
        `;

        // 1. Scripture Section (Open by default)
        html += `
            <div class="section-card">
                 <div class="section-title active" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined text-primary">menu_book</span>
                        말씀 본문
                    </div>
                    <span class="material-symbols-outlined toggle-icon">expand_more</span>
                 </div>
                 <div class="section-content active" style="display: block;">
                    <div class="verse-text">
        `;

        if (data.bibleReadingVideoUrl) {
            let videoId = '';
            // Handle standard URL (v=...)
            if (data.bibleReadingVideoUrl.includes('v=')) {
                videoId = data.bibleReadingVideoUrl.split('v=')[1].split('&')[0];
            }
            // Handle short URL (youtu.be/...)
            else if (data.bibleReadingVideoUrl.includes('youtu.be/')) {
                // Split by youtu.be/ and then take the first part before any '?'
                videoId = data.bibleReadingVideoUrl.split('youtu.be/')[1].split('?')[0];
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

        data.scriptureText.forEach(verse => {
            html += `<div class="verse"><span class="verse-num">${verse.verse}</span>${verse.text}</div>`;
        });
        html += `</div></div></div>`;

        // 2. Summary
        html += `
            <div class="section-card">
                <h2 class="section-title" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined text-primary">summarize</span>
                        오늘의 요약
                    </div>
                    <span class="material-symbols-outlined toggle-icon">expand_more</span>
                </h2>
                <div class="section-content">
                    <div class="text-content text-secondary">${data.summary}</div>
                </div>
            </div>
        `;

        // 3. Exposition
        html += `
            <div class="section-card">
                <h2 class="section-title" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined text-primary">school</span>
                        본문 해설
                    </div>
                    <span class="material-symbols-outlined toggle-icon">expand_more</span>
                </h2>
                <div class="section-content">
        `;
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
        html += `</div></div>`;

        // 4. Prayer
        html += `
            <div class="section-card prayer-card">
                <h2 class="section-title" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined" style="color: var(--success-color);">volunteer_activism</span>
                        오늘의 기도
                    </div>
                    <span class="material-symbols-outlined toggle-icon">expand_more</span>
                </h2>
                <div class="section-content">
                    <div class="text-content text-secondary" style="font-style: italic;">${data.prayer}</div>
                </div>
            </div>
        `;

        // 5. Essay
        html += `
             <div class="section-card essay-card">
                <h2 class="section-title" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined text-primary">format_quote</span>
                        묵상 에세이
                    </div>
                    <span class="material-symbols-outlined toggle-icon">expand_more</span>
                </h2>
                <div class="section-content">
                    <div class="text-content text-secondary">${data.essay.content}</div>
                </div>
            </div>
        `;

        // 6. One Verse (Always visible or toggle? Let's make it toggle too for consistency, but maybe distinct style)
        html += `
            <div class="section-card" style="background: var(--primary-color); color: white; border: none;">
                <div class="section-title" style="color: white; border-color: rgba(255,255,255,0.3);" onclick="toggleSection(this)">
                    <div class="section-title-content">
                        <span class="material-symbols-outlined" style="color: white;">auto_awesome</span>
                        한절 묵상
                    </div>
                    <span class="material-symbols-outlined toggle-icon" style="color: white;">expand_more</span>
                </div>
                <div class="section-content">
                    <div style="opacity: 0.9; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 700;">${data.oneVerse.verse}</div>
                    <div class="text-content" style="color: white; opacity: 0.95;">${data.oneVerse.content}</div>
                </div>
            </div>
        `;

        dailyContent.innerHTML = html;
        dailyContent.parentElement.scrollTo(0, 0);
    }

    // Add global toggle function
    window.toggleSection = function (headerElement) {
        headerElement.classList.toggle('active');
        const content = headerElement.nextElementSibling;

        if (content.style.display === 'block') {
            content.style.display = 'none';
            content.classList.remove('active');
        } else {
            content.style.display = 'block';
            content.classList.add('active');
        }
    };

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
