(function () {
  'use strict';

  var header = document.querySelector('.header--alt');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('header--solid', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  var menuHeader = document.querySelector('.header');
  var menuToggle = document.querySelector('.header__toggle');
  if (menuHeader && menuToggle) {
    var setMenu = function (open) {
      menuHeader.classList.toggle('header--open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    };
    menuToggle.addEventListener('click', function () {
      setMenu(!menuHeader.classList.contains('header--open'));
    });
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setMenu(false);
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1000) {
        setMenu(false);
      }
    });
  }

  document.querySelectorAll('.card__photo, .article__photo').forEach(function (img) {
    var hide = function () {
      img.remove();
    };
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) {
      hide();
    }
  });

  var MARK_CLASS = 'search-mark';
  var searchForm = document.querySelector('.search');
  var searchInput = document.querySelector('.search__input');
  var searchResult = document.querySelector('.search__result');
  var clearButton = document.querySelector('.search__button--clear');

  function clearHighlights() {
    document.querySelectorAll('mark.' + MARK_CLASS).forEach(function (mark) {
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(query) {
    var root = document.querySelector('main');
    if (!root) {
      return 0;
    }

    var regex = new RegExp(escapeRegExp(query), 'gi');
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var tag = node.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK' || tag === 'OPTION' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    var textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    var count = 0;
    textNodes.forEach(function (node) {
      var text = node.nodeValue;
      var match;
      var lastIndex = 0;
      var fragment = document.createDocumentFragment();
      var found = false;

      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }
        found = true;
        count++;
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        var mark = document.createElement('mark');
        mark.className = MARK_CLASS;
        mark.textContent = match[0];
        fragment.appendChild(mark);
        lastIndex = match.index + match[0].length;
      }

      if (found) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
      }
    });

    return count;
  }

  function runSearch() {
    clearHighlights();
    var query = searchInput.value.trim();

    if (query.length < 2) {
      searchResult.textContent = query.length === 0 ? '' : 'Мінімум 2 символи';
      return;
    }

    var count = highlight(query);
    searchResult.textContent = count > 0 ? 'Знайдено: ' + count : 'Нічого не знайдено';

    var first = document.querySelector('mark.' + MARK_CLASS);
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (searchForm && searchInput && searchResult) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      runSearch();
    });
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        clearHighlights();
        searchInput.value = '';
        searchResult.textContent = '';
      });
    }
  }

  var form = document.querySelector('.form');
  if (!form) {
    return;
  }

  var successBox = form.querySelector('.form__success');
  var dateField = form.querySelector('[name="date"]');

  function toISODate(date) {
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
  }

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (dateField) {
    dateField.min = toISODate(tomorrow);
    dateField.max = toISODate(maxDate);
  }

  var carField = form.querySelector('[name="car"]');
  var carParam = new URLSearchParams(window.location.search).get('car');
  if (carField && carParam) {
    var hasOption = Array.prototype.some.call(carField.options, function (option) {
      return option.value === carParam;
    });
    if (hasOption) {
      carField.value = carParam;
    }
  }

  var rules = {
    name: function (value) {
      var v = value.trim();
      if (v.length < 2) {
        return 'Введіть ім’я (мінімум 2 символи).';
      }
      if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґ'’\- ]+$/.test(v)) {
        return 'Ім’я має містити лише літери.';
      }
      return '';
    },
    email: function (value) {
      var v = value.trim();
      if (!v) {
        return 'Введіть email.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return 'Некоректний email (приклад: name@mail.com).';
      }
      return '';
    },
    phone: function (value) {
      var v = value.trim();
      if (!v) {
        return 'Введіть номер телефону.';
      }
      if (!/^\+380\d{9}$/.test(v)) {
        return 'Формат: +380XXXXXXXXX.';
      }
      return '';
    },
    car: function (value) {
      return value ? '' : 'Оберіть автомобіль.';
    },
    date: function (value) {
      if (!value) {
        return 'Оберіть дату заїзду.';
      }
      var chosen = new Date(value + 'T00:00:00');
      var min = new Date(toISODate(tomorrow) + 'T00:00:00');
      var max = new Date(toISODate(maxDate) + 'T00:00:00');
      if (isNaN(chosen.getTime())) {
        return 'Некоректна дата.';
      }
      if (chosen < min) {
        return 'Дата не може бути раніше завтрашнього дня.';
      }
      if (chosen > max) {
        return 'Бронювання доступне не далі ніж на рік уперед.';
      }
      return '';
    },
    laps: function (value) {
      if (value === '') {
        return 'Вкажіть кількість кіл.';
      }
      var n = Number(value);
      if (!Number.isInteger(n)) {
        return 'Кількість кіл має бути цілим числом.';
      }
      if (n < 1 || n > 5) {
        return 'Кількість кіл — від 1 до 5.';
      }
      return '';
    },
    message: function (value) {
      return value.trim().length > 300 ? 'Максимум 300 символів.' : '';
    },
    agree: function (value, field) {
      return field.checked ? '' : 'Потрібна згода на обробку даних.';
    },
  };

  function showError(field, message) {
    var group = field.closest('.form__group');
    var errorBox = group.querySelector('.form__error');
    errorBox.textContent = message;
    if (field.type !== 'checkbox') {
      field.classList.toggle('form__input--error', Boolean(message));
      field.classList.toggle('form__input--valid', !message && field.value !== '');
    }
  }

  function validateField(field) {
    var rule = rules[field.name];
    if (!rule) {
      return true;
    }
    var message = rule(field.value, field);
    showError(field, message);
    return message === '';
  }

  var fields = form.querySelectorAll('[name]');

  fields.forEach(function (field) {
    field.addEventListener('blur', function () {
      validateField(field);
    });
    field.addEventListener('change', function () {
      validateField(field);
    });
    field.addEventListener('input', function () {
      if (field.classList.contains('form__input--error')) {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var isValid = true;
    var firstInvalid = null;

    fields.forEach(function (field) {
      if (!validateField(field)) {
        isValid = false;
        if (!firstInvalid) {
          firstInvalid = field;
        }
      }
    });

    if (!isValid) {
      successBox.classList.add('form__success--hidden');
      firstInvalid.focus();
      return;
    }

    successBox.classList.remove('form__success--hidden');
    form.reset();
    fields.forEach(function (field) {
      field.classList.remove('form__input--valid', 'form__input--error');
    });
  });

  form.addEventListener('reset', function () {
    form.querySelectorAll('.form__error').forEach(function (box) {
      box.textContent = '';
    });
    fields.forEach(function (field) {
      field.classList.remove('form__input--valid', 'form__input--error');
    });
  });
})();
