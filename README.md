# moysklad-webhook-flatten-stack

> Приложение (AWS CDK стек) обрабатывает веб-хуки МойСклад, разбивает
> их на отдельные события для каждого элемента в поле `events` и перенаправляет
> снова на шину сообщений (Event Bus).

## Зачем?

В одном веб-хуке МойСклад может приходить сразу несколько событий. В то время как, обрабатывать события удобнее по одному либо группировать по некому условию или количеству.

Например, если веб-хуки перед обработкой складываются в очередь сообщений, то обрабатывая сразу несколько событий одного хука в рамках одного сообщения, можем столкнуться с ситуацией, когда часть событий обработаны успешно, а часть с ошибкой. Если оставить такое сообщение (веб-хук) в очереди, то в нем останется часть успешно обработанных событий, а если удалить, то потеряем события которые были не обработаны в результате ошибки.

С другой стороны, может быть удобно группировать события веб-хуков пачками с определенным кол-вом элементов для оптимизации обработки. Или наоборот выбирать события для обработки по полю `updatedFields`.

## Deploy

### [Install AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_install)

```bash
npm install -g aws-cdk@latest
```

```bash
cdk --version
```

### Create CodeCommit repository

...

```bash
git remote add origin [repository clone url]
```

```bash
  git push --set-upstream origin master
```

### Bootstrap AWS account

```
npx cdk bootstrap --profile default --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

```
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION --profile default --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

Get current `ACCOUNT-NUMBER`

```
aws sts get-caller-identity
aws sts get-caller-identity --profile default
```

Get current `REGION`

```
aws configure get region
aws configure get region --profile prod
```
