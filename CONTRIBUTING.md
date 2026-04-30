# Courier Web - Contribution Guidelines

[Courier Web][1] is an open-source project.
It is licensed using the [MIT License][2].
We appreciate pull requests; here are our guidelines:

1.  [File an issue][3]
    (if there isn't one already). If your patch
    is going to be large it might be a good idea to get the
    discussion started early. We are happy to discuss it in a
    new issue beforehand, and you can always email
    <foss+tech@go-jek.com> about future work.

2.  Please make sure your code compiles by running `pnpm build`

3.  If you want to test locally you can link the package using `pnpm link`

4.  DO follow our coding style (as described below).

5.  DO run the linter (`pnpm lint`) before submitting a pull request.

6.  DO include tests when adding new features. When fixing bugs,
    start with adding a test that highlights how the current
    behavior is broken.

7.  DO run the type checker (`pnpm typecheck`) to verify there are
    no type errors before submitting.

8.  We ask that you squash all the commits together before
    pushing and that your commit message references the bug.

9.  DON'T surprise us with big pull requests. Instead, file an
    issue and start a discussion so we can agree on a direction
    before you invest a large amount of time.

## Coding Style

The coding style employed here follows standard TypeScript conventions
with strict mode enabled. We use [Prettier][4] for formatting and
[ESLint][5] for linting.

## Issue Reporting

- Check that the issue has not already been reported.
- Be clear, concise and precise in your description of the problem.
- Open an issue with a descriptive title and a summary in grammatically correct,
  complete sentences.
- Include any relevant code to the issue summary.

## Pull Requests

- Please read this [how to GitHub][6] blog post.
- Use a topic branch to easily amend a pull request later, if necessary.
- Write [good commit messages][7].
- Use the same coding conventions as the rest of the project.
- Open a [pull request][8] that relates to *only* one subject with a clear title
  and description in grammatically correct, complete sentences.

Much Thanks!

GO-JEK Tech

[1]: https://github.com/gojekfarm/courier-web
[2]: https://opensource.org/licenses/MIT
[3]: https://github.com/gojekfarm/courier-web/issues
[4]: https://prettier.io/
[5]: https://eslint.org/
[6]: http://gun.io/blog/how-to-github-fork-branch-and-pull-request
[7]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
[8]: https://help.github.com/articles/using-pull-requests
