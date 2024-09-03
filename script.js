document.addEventListener('DOMContentLoaded', function() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const tracks = [];
    const trackControls = document.getElementById('trackControls');
    const seekBar = document.getElementById('seekBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationTimeDisplay = document.getElementById('durationTime');
    let duration = 0;
    let isSeeking = false;
    let startTime = 0;
    let pauseOffset = 0;
    let isPlaying = false;

    const audioFiles = [
        { name: "Vocal", url: "tracks/비워내려고%20합니다/비워내려고%20합니다%20-%204.4%20-%20Audio%20Track.mp3" },
        { name: "Main Guitar", url: "tracks/비워내려고%20합니다/비워내려고%20합니다%20-%201.4%20-%20Clean%20Guitar.mp3" },
        { name: "Bass", url: "tracks/비워내려고%20합니다/비워내려고%20합니다%20-%202.4%20-%20Electric%20Bass.mp3" },
        { name: "Drum", url: "tracks/비워내려고%20합니다/비워내려고%20합니다%20-%203.4%20-%20Drumkit.mp3" },
    ];

    audioFiles.forEach((file, index) => {
        const trackControl = document.createElement('div');
        trackControl.className = 'track-control';
        trackControl.innerHTML = `
            <span>${file.name}</span>
            <input type="range" min="0" max="100" value="100" data-track-index="${index}">
        `;
        trackControls.appendChild(trackControl);

        fetch(file.url)
            .then(response => response.arrayBuffer())
            .then(data => audioCtx.decodeAudioData(data))
            .then(buffer => {
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = 1;

                tracks.push({ buffer, gainNode, source: null });

                if (index === 0) {
                    duration = buffer.duration;
                    durationTimeDisplay.textContent = formatTime(duration);
                }

                trackControl.querySelector('input').addEventListener('input', function() {
                    gainNode.gain.value = this.value / 100;
                });
            });
    });

    function playTracks(offset = 0) {
        tracks.forEach((trackInfo, index) => {
            if (trackInfo.source) {
                trackInfo.source.stop();
            }

            const source = audioCtx.createBufferSource();
            source.buffer = trackInfo.buffer;
            source.connect(trackInfo.gainNode).connect(audioCtx.destination);
            source.start(0, offset);

            trackInfo.source = source;
        });
        startTime = audioCtx.currentTime - offset;
        isPlaying = true;
        updateSeekBar();
    }

    document.getElementById('playButton').addEventListener('click', function() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                isPlaying = true;
            });
        } else if (!isPlaying) {
            playTracks(pauseOffset);
        }
    });

    document.getElementById('pauseButton').addEventListener('click', function() {
        if (isPlaying) {
            audioCtx.suspend().then(() => {
                pauseOffset = audioCtx.currentTime - startTime;
                isPlaying = false;
            });
        }
    });

    seekBar.addEventListener('input', function() {
        isSeeking = true;
        const seekTo = duration * (this.value / 100);
        pauseOffset = seekTo;

        if (isPlaying) {
            tracks.forEach(trackInfo => {
                if (trackInfo.source) {
                    trackInfo.source.stop();
                }
            });
            playTracks(seekTo);
        } else {
            tracks.forEach(trackInfo => {
                if (trackInfo.source) {
                    trackInfo.source.stop();
                }
            });
            playTracks(seekTo);
        }

        currentTimeDisplay.textContent = formatTime(seekTo);
        isSeeking = false;
    });

    function updateSeekBar() {
        const interval = setInterval(() => {
            if (audioCtx.state === 'suspended' || isSeeking) {
                return;
            }

            const currentTime = audioCtx.currentTime - startTime;
            const progress = (currentTime / duration) * 100;
            seekBar.value = progress || 0;
            currentTimeDisplay.textContent = formatTime(currentTime);

            if (currentTime >= duration) {
                clearInterval(interval);
                isPlaying = false;
            }
        }, 100);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // PDF.js를 사용한 PDF 로드 및 표시
    const pdfFiles = {
        1: 'tracks/비워내려고%20합니다/비워내려고%20합니다(Main%20Guitar).pdf',
        2: 'tracks/비워내려고%20합니다/비워내려고%20합니다(Bass).pdf',
        3: 'tracks/비워내려고%20합니다/비워내려고%20합니다(Drum).pdf'
    };

    function loadPDF(session) {
        const url = pdfFiles[session];
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function (pdf) {
            console.log('PDF loaded');

            pdf.getPage(1).then(function (page) {
                console.log('Page loaded');

                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const pdfViewer = document.getElementById('pdfViewer');
                pdfViewer.innerHTML = '';  // 기존 내용을 지우고 새롭게 로드
                pdfViewer.appendChild(canvas);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext).promise.then(function () {
                    console.log('Page rendered');
                });
            });
        }, function (reason) {
            console.error(reason);
        });
    }

    // 기본적으로 첫 번째 세션의 PDF를 로드
    loadPDF(1);

    // 탭 클릭 시 해당 세션의 PDF를 로드
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const session = this.dataset.session;
            loadPDF(session);

            // 활성화된 탭을 업데이트
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
