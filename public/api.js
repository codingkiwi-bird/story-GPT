async function fetchData(prompt) {
    if (!prompt) {
        alert('입력값이 필요합니다.');
        return;
    }

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.result;
    } catch (error) {
        console.error('오류 발생:', error);
        alert('오류가 발생했습니다. 다시 시도해 주세요.');
    }
}

export { fetchData };
