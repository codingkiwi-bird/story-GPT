let step = 0;
let totalSteps = 5; // 고정된 분기 수
let fullStory = "";
let ending = "";

// 고정된 스토리
const fixedGenre = '미래의 내가 내 앞에 나타났다, 나는 결국 타임머신을 개발하는데 성공하였다고 한다.';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchData(endpoint, body) {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('429 Too Many Requests - 잠시 대기 후 재시도합니다.');
                    await delay(2000);
                    continue;
                }
                throw new Error('서버 오류가 발생했습니다.');
            }

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('오류 발생:', error);
            if (attempt === maxRetries - 1) {
                alert('오류가 발생했습니다. 다시 시도해 주세요.');
                return null;
            }
        }
    }
}

async function fetchTitle(story) {
    try {
        const response = await fetch('/api/generate-title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ story }),
        });

        if (!response.ok) {
            throw new Error('제목 생성 요청 실패');
        }

        const data = await response.json();
        return data.title;
    } catch (error) {
        console.error('제목 생성 중 오류:', error);
        return '제목 생성 실패';
    }
}

function updateStoryOutput(story, choices) {
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    storyContent.innerHTML = story;
    choicesContainer.innerHTML = '';

    if (Array.isArray(choices)) {
        choices.forEach((choice, index) => {
            const button = document.createElement("button");
            button.classList.add("choice-button");
            button.innerText = choice;
            button.addEventListener("click", () => handleChoice(index));
            choicesContainer.appendChild(button);
        });
    } else {
        console.error("유효하지 않은 선택지 데이터입니다:", choices);
    }
}

async function handleChoice(choiceIndex) {
    step++;

// "로딩중입니다" 팝업 띄우기
const loadingPopup = document.createElement("div");
loadingPopup.id = "loading-popup";
loadingPopup.style.position = "fixed";
loadingPopup.style.top = "50%";
loadingPopup.style.left = "50%";
loadingPopup.style.transform = "translate(-50%, -50%)";
loadingPopup.style.padding = "20px";
loadingPopup.style.backgroundColor = "rgba(0, 0, 0, 0)";
loadingPopup.style.color = "white";
loadingPopup.style.fontSize = "20px";
loadingPopup.style.borderRadius = "5px";
loadingPopup.style.display = "flex";
loadingPopup.style.flexDirection = "column"; // 이미지와 텍스트를 세로로 정렬
loadingPopup.style.alignItems = "center";    // 자식 요소들(이미지와 텍스트)을 가로로 중앙 정렬
loadingPopup.style.justifyContent = "center"; // 세로로 중앙 정렬

// 로딩 이미지 추가
const loadingImage = document.createElement("img");
loadingImage.src = "images/loading.gif";  // 여기 로딩 이미지 파일 경로 입력
loadingImage.alt = "로딩 중";
loadingImage.style.width = "100px";       // 이미지 크기 조정
loadingImage.style.height = "100px";      // 높이 조정
loadingImage.style.marginBottom = "20px"; // 텍스트와의 간격 추가

// 로딩 텍스트 추가
const loadingText = document.createElement("p");
loadingText.innerText = "로딩 중입니다...";
loadingText.style.fontSize = "24px";      // 텍스트 크기를 키움
loadingText.style.margin = "0";           // 불필요한 기본 여백 제거

// 팝업 크기 스타일 수정
loadingPopup.style.width = "300px";       // 팝업 너비
loadingPopup.style.height = "300px";      // 팝업 높이
loadingPopup.style.padding = "40px";      // 팝업 내부 여백
loadingPopup.style.borderRadius = "20px"; // 부드러운 모서리

// 팝업에 이미지와 텍스트 추가
loadingPopup.appendChild(loadingImage);

// 팝업을 body에 추가
document.body.appendChild(loadingPopup);


    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    storyContent.innerHTML = '';
    choicesContainer.innerHTML = '';

    if (step >= totalSteps) {
        ending = await fetchData('/api/generate-ending', { fullStory });
        document.getElementById("story-content").innerHTML = ending || '엔딩을 불러올 수 없습니다.';
        document.getElementById("choices-container").style.display = "none";

        fullStory += " " + ending;
        addStoryOutputButton();
    } else {
        await delay(1000);

        const nextStory = await fetchData('/api/generate-story', {
            fullStory,
            lastChoice: `선택지 ${choiceIndex + 1}`,
        });
        fullStory += " " + nextStory;

        await delay(1000);

        const choices = await fetchData('/api/generate-choice', { lastStory: nextStory });
        const choicesList = choices ? choices.split('\n').filter(choice => choice) : ['다시 시도해주세요.'];

        updateStoryOutput(nextStory, choicesList);
    }

    document.body.removeChild(loadingPopup);
}

function addStoryOutputButton() {
    const outputButton = document.createElement("button");
    outputButton.innerText = "스토리 출력";
    outputButton.classList.add("choice-button");
    outputButton.addEventListener("click", async () => {
        const title = await fetchTitle(fullStory);

        document.getElementById("story-output").innerHTML = `
            <h1>${title}</h1>
            <p>${fullStory}</p>
        `;

        setupShareButton(title, fullStory);

        const restartButton = document.createElement("button");
        restartButton.innerText = "처음으로";
        restartButton.classList.add("restart-button");
        restartButton.addEventListener("click", () => {
            location.reload();
        });

        const storyOutput = document.getElementById("story-output");
        if (storyOutput) {
            storyOutput.appendChild(restartButton);
        }
    });
    document.getElementById("story-content").appendChild(outputButton);
}

function setupShareButton(title, content) {
    const shareButton = document.createElement("button");
    shareButton.innerText = "공유하기";
    shareButton.classList.add("share-button");

    shareButton.addEventListener("click", () => {
        createPostModal(title, content);
    });

    const storyOutput = document.getElementById("story-output");
    if (storyOutput) {
        storyOutput.appendChild(shareButton);
    }
}

// `start-button` 클릭 시 호출되는 함수 수정
document.getElementById("start-button").addEventListener("click", async () => {
    const characterName = document.getElementById("characterName").value;

    if (!characterName) {
        alert('주인공 이름을 입력해 주세요.');
        return;
    }

    // 고정된 분기 수
    totalSteps = 2;

    document.getElementById("story-box").style.display = "none";
    const storyOutput = document.getElementById("story-output");
    storyOutput.style.display = "block";

    const intro = await fetchData('/api/generate-intro', {
        characterName,
    });

    if (!intro) {
        document.getElementById("story-content").innerHTML = '인트로를 불러올 수 없습니다.';
        return;
    }

    fullStory += " " + intro;

    await delay(1000);

    const choices = await fetchData('/api/generate-choice', { lastStory: intro });
    const choicesList = choices ? choices.split('\n').filter(choice => choice) : ['다시 시도해주세요.'];

    updateStoryOutput(intro, choicesList);
});
