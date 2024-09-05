document.addEventListener('DOMContentLoaded', function () {
    // 페이지 링크 데이터
    const pages = [
        { name: "비워내려고 합니다-김수영", url: "audio-page1.html" },
        { name: "비틀비틀-김수영", url: "audio-page2.html" },
        { name: "우리만은-최유리", url: "audio-page3.html" },
        { name: "홀로-정키", url: "audio-page4.html" },
        { name: "Always Remember Us This Way-Ladygaga", url: "audio-page5.html" },
        // 추가 페이지는 여기서 계속 추가
    ];

    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
        <h2><a href="index.html" style="color: white; text-decoration: none;">Ohrplexus</a></h2>
        <ul id="navLinks" class="nav-links"></ul>
    `;

    // 사이드바 링크를 동적으로 생성
    const navLinks = document.getElementById('navLinks');
    pages.forEach(page => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = page.url;
        a.textContent = page.name;
        li.appendChild(a);
        navLinks.appendChild(li);
    });
});
