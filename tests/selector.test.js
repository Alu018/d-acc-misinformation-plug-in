// Tests for CSS selector generation

describe('CSS Selector Generation', () => {
  beforeEach(() => {
    // Set up DOM structure for testing using jsdom test environment
    document.body.innerHTML = `
      <div id="unique-id">Test</div>
      <div class="container">
        <p>First paragraph</p>
        <p>Second paragraph</p>
        <p>Third paragraph</p>
      </div>
      <article>
        <section>
          <div>
            <span>Nested content</span>
          </div>
        </section>
      </article>
      <div data-test="special-chars-!@#$%">Content</div>
    `;
  });

  // Helper function from content.js
  function generateSelector(element) {
    if (!element || element.nodeType !== 1) {
      element = element?.parentElement;
    }

    if (!element) return '';

    const path = [];
    while (element && element.nodeType === 1) {
      let selector = element.nodeName.toLowerCase();

      if (element.id) {
        selector += `#${element.id}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = element;
        let nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth > 1) selector += `:nth-of-type(${nth})`;
      }

      path.unshift(selector);
      element = element.parentElement;
    }

    return path.join(' > ');
  }

  test('should generate selector for element with ID', () => {
    const element = document.getElementById('unique-id');
    const selector = generateSelector(element);
    expect(selector).toBe('div#unique-id');
  });

  test('should generate selector for nth element without ID', () => {
    const paragraphs = document.querySelectorAll('.container p');
    const secondP = paragraphs[1];
    const selector = generateSelector(secondP);
    expect(selector).toContain(':nth-of-type(2)');
  });

  test('should generate selector for deeply nested element', () => {
    const span = document.querySelector('article span');
    const selector = generateSelector(span);
    expect(selector).toContain('article');
    expect(selector).toContain('span');
  });

  test('should handle text node by using parent element', () => {
    const div = document.getElementById('unique-id');
    const textNode = div.firstChild;
    const selector = generateSelector(textNode);
    expect(selector).toBe('div#unique-id');
  });

  test('should return empty string for null element', () => {
    const selector = generateSelector(null);
    expect(selector).toBe('');
  });

  test('should generate unique selector that finds the element again', () => {
    const element = document.querySelector('.container p:nth-of-type(2)');
    const selector = generateSelector(element);
    const foundElement = document.querySelector(selector);
    expect(foundElement).toBe(element);
  });
});
