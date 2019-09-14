
function sum(a, b) {
    return a + b;
}

test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
});

const inputUrl = 'https://weisser-zwerg.dev/posts/local-discourse-on-vagrant/';

test('extract slug', () => {
    const pathElements = inputUrl.trim().split('/');
    let lastElement = null;
    for(const pe of pathElements) {
        if(pe.trim() != '')
            lastElement = pe.trim();
    }
    if(lastElement.includes('.')) {
        const elements = lastElement.splice('.');
        lastElement = elements[0];
    }
    console.log(lastElement);
})
