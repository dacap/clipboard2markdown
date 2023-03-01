(function () {
  'use strict';

  // http://pandoc.org/README.html#pandocs-markdown
  var pandoc = [
    {
      filter: 'h1',
      replacement: function (content, node) {
        return '\n\n# ' + content + '\n\n';
      }
    },

    {
      filter: 'h2',
      replacement: function (content, node) {
        return '\n\n## ' + content + '\n\n';
      }
    },

    {
      filter: 'h3',
      replacement: function (content, node) {
        return '\n\n### ' + content + '\n\n';
      }
    },

    {
      filter: 'h4',
      replacement: function (content, node) {
        return '\n\n#### ' + content + '\n\n';
      }
    },

    {
      filter: 'sup',
      replacement: function (content) {
        return '^' + content + '^';
      }
    },

    {
      filter: function (node) {
        var style = node.getAttribute('style') || '';
        return (node.nodeName === 'SPAN' &&
                node.parentNode.nodeName === 'H3' &&
                style.toLowerCase().includes('font-size: 8pt') ? true: false);
      },
      replacement: function (content, node) {
        return '<small>' + content + '</small>';
      }
    },

    {
      filter: 'sub',
      replacement: function (content) {
        return '~' + content + '~';
      }
    },

    {
      filter: 'br',
      replacement: function () {
        return '\\\n';
      }
    },

    {
      filter: 'hr',
      replacement: function () {
        return '\n\n---\n\n';
      }
    },

    {
      filter: function (node) {
        var style = node.getAttribute('style') || '';
        return (['EM', 'I', 'CITE', 'VAR'].includes(node.nodeName) ||
                style.toLowerCase().includes('font-style: italic') ? true: false);
      },
      replacement: function (content) {
        return '*' + content + '*';
      }
    },

    {
      filter: function (node) {
        var style = node.getAttribute('style') || '';
        return (['B', 'STRONG'].includes(node.nodeName) ||
                style.toLowerCase().includes('font-weight: 700') ? true: false);
      },
      replacement: function (content) {
        return '**' + content + '**';
      }
    },

    {
      filter: function (node) {
        var hasSiblings = node.previousSibling || node.nextSibling;
        var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
        var style = node.getAttribute('style') || '';
        var isCodeElem = node.nodeName === 'CODE' ||
            node.nodeName === 'KBD' ||
            node.nodeName === 'SAMP' ||
            node.nodeName === 'TT' ||
            style.toLowerCase().includes('courier new');

        return isCodeElem && !isCodeBlock;
      },
      replacement: function (content) {
        return '`' + content + '`';
      }
    },

    {
      filter: function (node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function (content, node) {
        var url = node.getAttribute('href');
        var titlePart = node.title ? ' "' + node.title + '"' : '';
        if (content === url) {
          return '<' + url + '>';
        } else if (url === ('mailto:' + content)) {
          return '<' + content + '>';
        } else {
          return '[' + content + '](' + url + titlePart + ')';
        }
      }
    },

    {
      filter: 'li',
      replacement: function (content, node) {
        content = content.replace(/^\s+/, '').replace(/\n/gm, ' ');
        var prefix = '* ';
        var parent = node.parentNode;

        if (/ol/i.test(parent.nodeName)) {
          var index = Array.prototype.indexOf.call(parent.children, node) + 1;
          prefix = index + '. ';
          while (prefix.length < 4) {
            prefix += ' ';
          }
        }
        else if (/ul/i.test(parent.nodeName)) {
          parent = parent.parentNode;
          while (parent && /ul/i.test(parent.nodeName)) {
            prefix = '  ' + prefix;
            parent = parent.parentNode;
          }
        }
        return prefix + content;
      }
    }
  ];

  // http://pandoc.org/README.html#smart-punctuation
    var escape = function (str) {
    return str.replace(/ /g, " ")
              .replace(/[\u2018\u2019\u00b4]/g, "'")
              .replace(/[\u201c\u201d\u2033]/g, '"')
              .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
              .replace(/[\u2013\u2015]/g, '--')
              .replace(/\u2014/g, '---')
              .replace(/\u2026/g, '...')
              .replace(/[ ]+\n/g, '\n')
              .replace(/\s*\\\n/g, '\\\n')
              .replace(/\s*\\\n\s*\\\n/g, '\n\n')
              .replace(/\s*\\\n\n/g, '\n\n')
              .replace(/\n-\n/g, '\n')
              .replace(/\n\n\s*\\\n/g, '\n\n')
              .replace(/\n\n\n*/g, '\n\n')
              .replace(/[ ]+$/gm, '')
              .replace(/^\s+|[\s\\]+$/g, '');
  };

  var convert = function (str) {
    return escape(toMarkdown(str, { converters: pandoc, gfm: true }));
  }

  var insert = function (myField, myValue) {
      if (document.selection) {
          myField.focus();
          sel = document.selection.createRange();
          sel.text = myValue;
          sel.select()
      } else {
          if (myField.selectionStart || myField.selectionStart == "0") {
              var startPos = myField.selectionStart;
              var endPos = myField.selectionEnd;
              var beforeValue = myField.value.substring(0, startPos);
              var afterValue = myField.value.substring(endPos, myField.value.length);
              myField.value = beforeValue + myValue + afterValue;
              myField.selectionStart = startPos + myValue.length;
              myField.selectionEnd = startPos + myValue.length;
              myField.focus()
          } else {
              myField.value += myValue;
              myField.focus()
          }
      }
  };

  // http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
  document.addEventListener('DOMContentLoaded', function () {
    var info = document.querySelector('#info');
    var pastebin = document.querySelector('#pastebin');
    var output = document.querySelector('#output');
    var wrapper = document.querySelector('#wrapper');

    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey || event.metaKey) {
        if (String.fromCharCode(event.which).toLowerCase() === 'v') {
          pastebin.innerHTML = '';
          pastebin.focus();
          info.classList.add('hidden');
          wrapper.classList.add('hidden');
        }
      }
    });

    pastebin.addEventListener('paste', function () {
      setTimeout(function () {
        var html = pastebin.innerHTML;
        var markdown = convert(html);
        // output.value = markdown;
        insert(output, markdown);
        wrapper.classList.remove('hidden');
        output.focus();
        output.select();
      }, 200);
    });
  });
})();
