## 2.0.2
###### Jul 10, 2019

- Fixed bug where `-mui-mixins` would include a trailing comma after the last function argument, which breaks in IE11
- Bump eslint versions

## 2.0.1
###### Jun 29, 2019

**NOTE: This version of css-to-mui-loader fixes keyframe animations for jss@10.0.0**

- Fix animation names to support jss@10.0.0-alpha.1. This version of jss switched `@keyframes` to be [scoped by default](https://github.com/cssinjs/jss/blob/master/changelog.md#breaking-changes-2). @material-ui/styles has been using jss@10 [for some time](https://github.com/mui-org/material-ui/blob/master/CHANGELOG.md#material-uistylesv300-alpha5).

## 2.0.0
###### Jun 29, 2019

**BREAKING CHANGES: css-to-mui-loader now only supports @materia-ui/core@4.0.0 and up**

- Switch to new Material UI `theme.spacing()` API, [introduced](https://github.com/mui-org/material-ui/blob/master/CHANGELOG.md#deprecation) in @material-ui/core@4.0.0

## 1.3.3
###### Jun 16, 2019

- Upgraded devDependencies

## 1.3.2
###### Mar 5, 2019

- Upgraded devDependencies

## 1.3.1
###### Dec 2, 2018

- Added link to [css-to-mui-loader-example](https://github.com/mcdougal/css-to-mui-loader-example) demo repo in README
- Added MIT license file

## 1.3.0
###### Dec 2, 2018

- `babel-loader` is no longer required. Instead of this:
  ```js
  rules: [
    {
      test: /\.css$/,
      use: [ 'babel-loader', 'css-to-mui-loader' ]
    }
  ]
  ```
  you can now just do this:
  ```js
  rules: [
    {
      test: /\.css$/,
      use: [ 'css-to-mui-loader' ]
    }
  ]
  ```

## 1.2.1
###### Oct 26, 2018

- Updated README to reflect that ES5 compatibility has not been reached and
  babel-loader is still required

## 1.2.0
###### Oct 26, 2018

- Closer to full ES5 compatibility. Removed the following from loader output:
  - template literals
  - object rest spread
- Fixed a bug where comments in keyframes would cause the loader to crash

## 1.1.0
###### Sept 22, 2018

- Added support for `@keyframes`
- Fixed a bug where defining a media query multiple times would cause it to render
  above other rules, resulting in specificity problems
- Only run `prettier` if the `CSS_TO_MUI_TEST` environment variable is non-null.
  Code formatting was just used to make expected test output easier to read, but
  it is not needed otherwise.

## 1.0.2
###### Sept 7, 2018

- Moved `prettier` to dependencies instead of devDependencies

## 1.0.1
###### Sept 7, 2018

- README updates
