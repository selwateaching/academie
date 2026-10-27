document.addEventListener('submit', function (e) {
  var m = e.target.getAttribute('data-confirm');
  if (m && !confirm(m)) e.preventDefault();
});
document.addEventListener('change', function (e) {
  if (e.target.hasAttribute('data-autosubmit')) e.target.form.submit();
});
document.addEventListener('click', function (e) {
  if (e.target.hasAttribute('data-print')) window.print();
});
