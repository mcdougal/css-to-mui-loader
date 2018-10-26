## 1.2.0
###### Oct 26, 2018

- Improved compatibility with older JS environments by removing:
  - template literals
  - object rest spread
- Fixed a bug where comments in keyframes would cause the loader to crash

## 1.1.0
###### Sept 22, 2018

- `babel-loader` is no longer needed to handle the output of `css-to-mui-loader`
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
