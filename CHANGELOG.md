1.0.3 / PENDING
===============

**Notable:**

* `babel-loader` is no longer needed to handle the output of `css-to-mui-loader`

**Other:**

* Fixed a bug where defining a media query multiple times would cause it to render
  above other rules, resulting in specificity problems
* Only run `prettier` if the `CSS_TO_MUI_TEST` environment variable is non-null.
  Code formatting was just used to make expected test output easier to read, but
  it is not needed otherwise.
* Added CHANGELOG

1.0.2 / 2018-09-07
==================

* Moved `prettier` to dependencies instead of devDependencies

1.0.1 / 2018-09-07
==================

* README updates
