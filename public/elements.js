const storyElementsData = [
    {
        label: '주인공 이름',
        id: 'characterName',
        type: 'input'
    },
    
];

function createStoryElements() {
    const storyElementsContainer = document.getElementById("story-elements");
    
    storyElementsData.forEach(({ label, id, type, options }) => {
        const elementContainer = document.createElement('div');
        elementContainer.className = 'element-select';

        const labelElement = document.createElement('label');
        labelElement.htmlFor = id;
        labelElement.textContent = `${label}:`;
        elementContainer.appendChild(labelElement);

        if (type === 'input') {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = id;
            input.className = 'form-control';
            elementContainer.appendChild(input);
        } else {
            const select = document.createElement('select');
            select.id = id;
            select.className = 'form-select';
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            elementContainer.appendChild(select);
        }

        storyElementsContainer.appendChild(elementContainer);
    });
}


document.addEventListener("DOMContentLoaded", createStoryElements);

// 시작 버튼 클릭 시 처리 함수
function startButtonClickHandler() {
    const storyBox = document.getElementById("story-box");
    const storyOutput = document.getElementById("story-output");
    const characterName = document.getElementById("characterName").value;

    // 주인공 이름이 입력되지 않은 경우 경고창만 띄우고 종료
    if (!characterName.trim()) {
        return; // 함수 종료
    }

    // 주인공 이름이 입력되었을 경우에만 아래 코드 실행
    storyOutput.style.visibility = "visible";
    storyOutput.classList.add("active");

    // 스토리 선택 화면 숨기기
    storyBox.style.display = "none";

    // 스토리 시작
    startStory();
}

// 스토리 및 선택지 초기화 및 시작
function startStory() {
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    // 첫 스토리와 선택지 초기화
storyContent.innerHTML = `
    <span class="intro-text">로딩 중</span>
    <div class="loading-container">
        <img src="images/loading.gif" alt="로딩 중" class="loading-gif">
    </div>
`; 
choicesContainer.innerHTML = '';


}

// 시작 버튼 클릭 이벤트 리스너 등록
document.getElementById("start-button").addEventListener("click", startButtonClickHandler);
