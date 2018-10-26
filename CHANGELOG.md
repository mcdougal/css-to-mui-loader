1.1.1 / Unpublished
===================

**Bug fixes:**

* Removed template literals from loader output so the final JS code can run in
  more environments (like IE)

1.1.0 / 2018-09-22
==================

**Features:**

* `babel-loader` is no longer needed to handle the output of `css-to-mui-loader`
* Added support for @keyframes

**Bug fixes:**

* Fixed a bug where defining a media query multiple times would cause it to render
  above other rules, resulting in specificity problems

**Other:**

* Only run `prettier` if the `CSS_TO_MUI_TEST` environment variable is non-null.
  Code formatting was just used to make expected test output easier to read, but
  it is not needed otherwise.

1.0.2 / 2018-09-07
==================

* Moved `prettier` to dependencies instead of devDependencies

1.0.1 / 2018-09-07
==================

* README updates
