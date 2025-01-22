# Razor Expressions

- [x] Implicit Razor Expressions `@DateTime.Now`
- [x] Await Expressions `<p>@await DoSomething("hello", "world")</p>`
- [x] Explicit Razor Expressions `<p>(DateTime.Now - TimeSpan.FromDays(7)(</p>`
- [x] Razor Code Blocks `@code{}` and `@{}`
- [x] Implicit Transitions
- [x] Explicit Transitions
- [x] Explicit Line Transitions `@:`

# Control Structure

## Conditionals

- [x] If, elseif, else, switch

## Looping

- [x] for, foreach, while, do while

- [ ] Compound Using `@using (Html.BeginForm()){}`
- [ ] try, catch, finally
- [ ] lock `@lock (SomeLock) {}`

# Comments

- [x] Razor
- [x] CSharp
- [ ] HTML

# Directives

- [ ] Attribute `@attribute [Authorize]` / `@attribute[Route(Constants.CounterRoute)#]`
- [x] code
- [x] functions (same as code)
- [ ] implements `@implements IDisposable`
- [ ] inherits `@inherits TypeNameOfClassToInheritFrom`
- [x] inject
- [ ] layout
- [ ] model
- [ ] namespace
- [x] page
- [ ] preservewhitespace
- [x] renderMode
- [x] section
- [ ] typeparam
- [x] using
