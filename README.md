# moysklad-webhook-flatten-stack

> Приложение (AWS CDK стек) обрабатывает веб-хуки МойСклад, разбивает
> их на отдельные события для каждого элемента в поле `events` и перенаправляет
> снова на шину сообщений (Event Bus).

## Зачем?

В одном веб-хуке МойСклад может приходить сразу несколько событий. В то время как, обрабатывать события удобнее по одному либо группировать по некому условию или количеству.

Например, если веб-хуки перед обработкой складываются в очередь сообщений, то обрабатывая сразу несколько событий одного хука в рамках одного сообщения, можем столкнуться с ситуацией, когда часть событий обработаны успешно, а часть с ошибкой. Если оставить такое сообщение (веб-хук) в очереди, то в нем останется часть успешно обработанных событий, а если удалить, то потеряем события которые были не обработаны в результате ошибки.

С другой стороны, может быть удобно группировать события веб-хуков пачками с определенным кол-вом элементов для оптимизации обработки. Или наоборот выбирать события для обработки по полю `updatedFields`.

## Deploy stack CI pipeline

### [Install AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_install)

```bash
npm install -g aws-cdk@latest
```

```bash
cdk --version
```

### Update config (if necessary)

Update `stack/config.ts`

### Install dependencies and test project

```bash
npm install
```

```bash
npm run test
```

### Create CodeCommit repository

> For consistence use CammelCase naming convention

```bash
APP_NAME=MoyskladWebhookFlattenStack

APP_DESCRIPTION="Разбитие событий веб-хуков на отдельные сообщения"
```

```bash
aws codecommit create-repository --repository-name $APP_NAME --repository-description $APP_DESCRIPTION --profile default
```

command output:

```json
{
  "repositoryMetadata": {
    "accountId": "910985846600",
    "repositoryId": "5f59123b-e5ee-4dcc-b920-7e5d667b0cb2",
    "repositoryName": "MoyskladWebhookFlattenStack",
    "repositoryDescription": "Разбитие событий веб-хуков на отдельные сообщения",
    "lastModifiedDate": "2021-11-27T09:44:46.076000+05:00",
    "creationDate": "2021-11-27T09:44:46.076000+05:00",
    "cloneUrlHttp": "https://git-codecommit.eu-west-1.amazonaws.com/v1/repos/MoyskladWebhookFlattenStack",
    "cloneUrlSsh": "ssh://git-codecommit.eu-west-1.amazonaws.com/v1/repos/MoyskladWebhookFlattenStack",
    "Arn": "arn:aws:codecommit:eu-west-1:910985846600:MoyskladWebhookFlattenStack"
  }
}
```

Ensure you have valid [ssh config](https://gist.github.com/wmakeev/4df153853c203d80a41f58f862635e60) for CodeCommit.

```bash
REPO_CLONE_URL=[cloneUrlSsh]
```

Replace host (`git-codecommit.eu-west-1.amazonaws.com`) in `cloneUrlSsh` to alias, if necessary.

Add origin

```bash
git remote add origin $REPO_CLONE_URL
```

Commit all current changes.

Push to master

```bash
git push --set-upstream origin master
```

### Bootstrap AWS account (if necessary)

Once for each deploy region in current account,

```
npx cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --profile default
```

or specific account

```
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --profile default
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

### Configure EventBridge bus

Ensure `webhook` EventBridge bus is exist or create it.

To recieve webhooks, [webhook-to-eventbridge](https://github.com/wmakeev/webhook-to-eventbridge) stack can be used.

### Deploy CDK stack

> TODO Local repository should pushed to current AWS profile CodeCommit

```bash
PROFILE=default npm run deploy
```
