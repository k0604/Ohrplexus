document.addEventListener('DOMContentLoaded', function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const tracks = [];
    const audioPlayer = document.getElementById('audioPlayer');

    // 재생 UI 요소 동적 생성
    audioPlayer.innerHTML = `
        <div id="audioControls">
            <button id="playButton">재생</button>
            <button id="pauseButton">일시정지</button>
            <input type="range" id="seekBar" min="0" max="100" value="0">
            <div>
                <span id="currentTime">0:00</span> / <span id="durationTime">0:00</span>
            </div>
        </div>
        <div id="trackControls"></div>
    `;

    const seekBar = document.getElementById('seekBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationTimeDisplay = document.getElementById('durationTime');
    let duration = 0;
    let isSeeking = false;
    let startTime = 0;
    let pauseOffset = 0;
    let isPlaying = false;

    // HTML data-* 속성에서 오디오 파일 정보를 가져오기
    const audioFiles = JSON.parse(document.getElementById('audioPlayer').dataset.audioFiles);

    audioFiles.forEach((file, index) => {
        const trackControl = document.createElement('div');
        trackControl.className = 'track-control';
        trackControl.innerHTML = `
            <span>${file.name}</span>
            <input type="range" min="0" max="100" value="100" data-track-index="${index}">
        `;
        document.getElementById('trackControls').appendChild(trackControl);

        fetch(file.url)
            .then(response => response.arrayBuffer())
            .then(data => audioCtx.decodeAudioData(data))
            .then(buffer => {
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = 1;

                tracks.push({
                    buffer,
                    gainNode,
                    source: null,
                });

                if (index === 0) {
                    duration = buffer.duration;
                    durationTimeDisplay.textContent = formatTime(duration);
                }

                trackControl.querySelector('input').addEventListener('input', function () {
                    const newVolume = this.value / 100;
                    gainNode.gain.value = newVolume;
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

    document.getElementById('playButton').addEventListener('click', function () {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                isPlaying = true;
            });
        } else if (!isPlaying) {
            playTracks(pauseOffset);
        }
    });

    document.getElementById('pauseButton').addEventListener('click', function () {
        if (isPlaying) {
            audioCtx.suspend().then(() => {
                pauseOffset = audioCtx.currentTime - startTime;
                isPlaying = false;
            });
        }
    });

    seekBar.addEventListener('input', function () {
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

    // PDF 악보 표시 관련 변수
    const pdfFrame = document.getElementById('pdfFrame');
    const tabButtons = document.querySelectorAll('.tab-button');

    // HTML data-* 속성에서 PDF 파일 정보를 가져오기
    const pdfFiles = JSON.parse(document.getElementById('pdfFrame').dataset.pdfFiles);

    // 처음 로드될 때 첫 번째 세션의 PDF를 표시
    pdfFrame.src = pdfFiles[1];
    tabButtons[0].classList.add('active');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // 활성화된 탭을 업데이트
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 해당 세션의 PDF 파일을 iframe에 로드
            const session = this.dataset.session;
            pdfFrame.src = pdfFiles[session];
        });
    });
});
