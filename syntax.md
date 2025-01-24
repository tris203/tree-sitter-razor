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

- [x] Compound Using `@using (Html.BeginForm()){}`
- [x] try, catch, finally
- [x] lock `@lock (SomeLock) {}`

# Comments

- [x] Razor
- [x] CSharp
- [x] HTML

# Directives

- [x] Attribute `@attribute [Authorize]` / `@attribute[Route(Constants.CounterRoute)#]`
- [x] code
- [x] functions (same as code)
- [x] implements `@implements IDisposable`
- [x] inherits `@inherits TypeNameOfClassToInheritFrom`
- [x] inject
- [x] layout
- [x] model
- [x] namespace
- [x] page
- [x] preservewhitespace
- [x] renderMode
- [x] section
- [x] typeparam
- [x] using
