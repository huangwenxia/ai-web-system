# Windows 本地启动 Metis XCloud 环境准备清单

## 1. 文档目的

本文用于指导开发人员在 Windows 电脑上编译、启动和验证 Metis XCloud 服务。

本文基于以下信息整理：

- Metis XCloud 当前仓库的 Maven 模块和启动配置。
- Obsidian 中已有的 XCloud 业务逻辑、启动依赖和故障排查记录。
- 2026-07-23 已验证的 `metis-xcloud-general` 本地构建和启动过程。

本文推荐的默认模式是：

> Windows 本机只启动需要调试的 XCloud 模块，复用开发或测试环境的 Nacos、MySQL、Redis、Kafka和公共服务。

这种方式不要求在 Windows 本机安装完整的中间件集群。

## 2. 启动模式选择

### 2.1 共享环境模式，推荐

Windows 本机运行 XCloud Java 进程，通过公司内网或 VPN 连接共享环境。

需要准备：

- JDK、Maven、Git 和 IntelliJ IDEA。
- 公司 Maven 私服配置。
- Nacos 地址、账号、密码和 namespace。
- Nacos 配置中引用的 MySQL、Redis、Kafka等服务可从 Windows 访问。
- 同 namespace 中存在健康的 `metis-common-service`。

适合场景：

- 调试 Controller、Service、Mapper 等后端代码。
- 调试云平台、云账号、地域、授权和资源池接口。
- 调试指定云厂商适配逻辑。
- 本地接口验证和问题复现。

### 2.2 完全本地化模式

所有基础设施和业务服务都在 Windows 本机或本机容器中运行。

除共享环境模式的工具外，还要自行准备：

- Nacos。
- MySQL 及完整业务库表和基础数据。
- Redis。
- Kafka。
- `metis-common-service`。
- 认证、权限和网关相关服务。
- 全套 Nacos Data ID 和环境配置。

当前仓库没有可直接拉起完整环境的 `docker-compose`，也没有一键初始化脚本。因此，除非需要做环境隔离或离线开发，否则不建议将完全本地化模式作为首次启动方案。

## 3. Windows 本机软件

| 软件 | 建议版本 | 是否必需 | 说明 |
| --- | --- | --- | --- |
| Windows | Windows 10/11 64 位 | 是 | 建议启用 Windows Long Paths |
| Amazon Corretto | 22.0.2 64 位 | 是 | 团队 Java 编译和验证默认版本 |
| Apache Maven | 3.9.x | 是 | 当前仓库没有 Maven Wrapper |
| Git for Windows | 当前稳定版本 | 是 | 用于代码获取和版本管理 |
| IntelliJ IDEA | 当前团队统一版本 | 推荐 | 运行和调试 Spring Boot 服务 |
| Lombok 插件 | 与 IDEA 匹配 | 推荐 | 同时启用 Annotation Processing |
| Docker Desktop | 不固定 | 否 | 仅完全本地化模式可能需要 |

当前 Maven 有效配置的 Java `source` 和 `target` 均为 21，但团队本地验证统一使用 Amazon Corretto 22。因此不要使用系统中更高版本的 JDK 作为默认构建 JDK。

## 4. Java 环境配置

假设 Corretto 安装在：

```text
C:\Program Files\Amazon Corretto\jdk22.0.2_9
```

配置系统环境变量：

```text
JAVA_HOME=C:\Program Files\Amazon Corretto\jdk22.0.2_9
```

在 `Path` 中增加：

```text
%JAVA_HOME%\bin
```

验证：

```powershell
java -version
```

预期看到 Amazon Corretto 22。

## 5. Maven 环境配置

### 5.1 安装 Maven

假设 Maven 安装在：

```text
C:\tools\apache-maven-3.9.x
```

配置：

```text
MAVEN_HOME=C:\tools\apache-maven-3.9.x
```

在 `Path` 中增加：

```text
%MAVEN_HOME%\bin
```

验证：

```powershell
mvn -version
```

检查输出中的 Java Home 是否指向 Corretto 22。

### 5.2 项目专用 Maven 仓库

Windows 建议使用：

```text
C:\maven-repos\metis-xcloud
```

准备：

```text
C:\maven-repos\metis-xcloud\setting.xml
```

将 `setting.xml` 中的本地仓库配置调整为 Windows 路径：

```xml
<localRepository>C:\maven-repos\metis-xcloud</localRepository>
```

还必须保留团队配置中的：

- 公司 Nexus/Maven 私服 mirror。
- `metis-dev` 等内部仓库。
- 必要的 server 认证配置。

不要把密码或 Token 提交到 Git。

如果公司 Maven 私服不可访问，以下内部依赖无法正常解析：

```text
com.onepro.metis:metis:3.8.3
com.onepro.metis:metis-common-*:3.8.3
com.onepro.xcloud:*:3.8.3
```

## 6. 网络和基础服务条件

Windows 电脑必须通过公司内网或 VPN 访问以下资源：

| 资源 | 用途 | 是否必须 |
| --- | --- | --- |
| Nacos | 配置中心和服务发现 | 是 |
| Maven/Nexus 私服 | 下载内部 Maven 依赖 | 是 |
| MySQL | XCloud 业务数据 | 是 |
| Redis | 缓存、同步状态和事件结果 | 是 |
| `metis-common-service` | 启动期远程系统参数加载 | 是 |
| Kafka | 资源同步和异步清理 | 视功能而定 |
| `metis-gateway` | 通过统一网关访问接口 | 视调试方式而定 |
| 云厂商 OpenAPI | 账号校验和实时资源操作 | 视云厂商功能而定 |

当前仓库本地运行配置使用过：

```text
NACOS_HOST=192.168.5.195
NACOS_PORT=8848
NACOS_NS=mdev
```

该地址仅代表当前开发环境记录。实际使用前应向环境负责人确认 Nacos 地址、namespace 和凭证。

在 Windows PowerShell 中检查 Nacos 端口：

```powershell
Test-NetConnection 192.168.5.195 -Port 8848
```

预期：

```text
TcpTestSucceeded : True
```

## 7. Nacos 配置要求

每个 XCloud 启动模块都会从 Nacos 导入：

```text
metis-sys-config.yml
application.yml
metis-xcloud.yml
logback-spring-xcloud-local.xml
metis-xcloud-{模块名}.yml
```

例如 `metis-xcloud-general` 最后一个 Data ID 为：

```text
metis-xcloud-general.yml
```

必须确认：

- 所有 Data ID 位于选定的 namespace。
- 配置使用正确的 Group，通常为 `DEFAULT_GROUP`。
- 数据库、Redis、Kafka地址可从 Windows 访问。
- 当前 namespace 中存在健康的 `metis-common-service`。
- Nacos 账号拥有读取配置和查询服务实例的权限。

### 7.1 namespace 不能省略

代码默认值为：

```text
NACOS_NS=dev
```

开发环境通常使用 `mdev`，测试环境通常使用 `mtest`。如果不显式指定，服务可能错误连接到 `dev`。

### 7.2 `metis-common-service` 是启动期关键依赖

XCloud 启动后会通过 Feign 调用公共服务加载系统参数。

如果当前 namespace 中没有健康的 `metis-common-service`，日志通常出现：

```text
Load balancer does not contain an instance for the service metis-common-service
```

或者：

```text
No servers available for service: metis-common-service
```

这类现象通常不是 XCloud 主类无法启动，而是进程启动后缺少公共服务依赖。

## 8. XCloud 服务模块

XCloud 不是一个单独的 Java 进程，而是多个独立启动模块。

| 服务 | 默认端口 | Main Class | 主要职责 |
| --- | --- | --- | --- |
| `metis-xcloud-general` | `8001` | `com.onepro.metis.xcloud.general.MetisXcloudGeneralApplication` | 通用 CRUD、授权和资源查询 |
| `metis-xcloud-aliyun` | `8002` | `com.onepro.metis.xcloud.aliyun.MetisXcloudAliyunApplication` | 阿里云资源适配 |
| `metis-xcloud-huawei` | `8005` | `com.onepro.metis.xcloud.huawei.MetisXcloudHuaweiApplication` | 华为云资源适配 |
| `metis-xcloud-infracube` | `8007` | `com.onepro.xcloud.infracube.MetisXcloudInfracubeApplication` | Infracube/Wanmore 适配 |
| `metis-xcloud-cmdb` | `8008` | `com.onepro.metis.xcloud.cmdb.MetisXcloudCMDBApplication` | CMDB 同步 |
| `metis-xcloud-google` | `8010` | `com.onepro.metis.xcloud.google.MetisXcloudGoogleApplication` | Google Cloud 适配 |

建议先启动 `metis-xcloud-general`。

只有调试云厂商实时能力时，才启动对应的云厂商模块。例如调试阿里云账号验证或实时规格查询时，再启动 `metis-xcloud-aliyun`。

## 9. IntelliJ IDEA 配置

### 9.1 导入项目

1. 使用根目录 `pom.xml` 将项目作为 Maven 工程导入。
2. Project SDK 设置为 Corretto 22。
3. Maven Runner JRE 设置为 Corretto 22。
4. Maven Importer JDK 设置为 Corretto 22。
5. 启用 Lombok 和 Annotation Processing。
6. Maven User settings file 指向：

```text
C:\maven-repos\metis-xcloud\setting.xml
```

7. Maven Local repository 设置为：

```text
C:\maven-repos\metis-xcloud
```

### 9.2 `metis-xcloud-general` Run Configuration

配置：

```text
Main class:
com.onepro.metis.xcloud.general.MetisXcloudGeneralApplication

Module:
metis-xcloud-general

JRE:
Amazon Corretto 22
```

VM Options：

```text
-DNACOS_HOST=<Nacos地址>
-DNACOS_PORT=8848
-DNACOS_NS=mdev
-DNACOS_PASSWORD=<Nacos密码>
-DLOG_DIR=..\logs
-DLOG_MODE=local
-Dserver.port=8001
--add-opens=java.base/java.lang=ALL-UNNAMED
--add-opens=java.base/java.lang.reflect=ALL-UNNAMED
--add-opens=java.base/java.math=ALL-UNNAMED
--add-opens=java.base/java.util=ALL-UNNAMED
```

将以上内容填写在同一个 VM Options 输入框中时，可以使用空格连接。

## 10. 是否注册到共享 Nacos

### 10.1 默认推荐：不注册

仅在本地直接调用和验证接口时，建议增加：

```text
-Dspring.cloud.nacos.discovery.register-enabled=false
-Dspring.cloud.service-registry.auto-registration.enabled=false
```

这样本地服务可以读取 Nacos 配置和发现其他服务，但不会把 Windows 本机地址注册到共享环境。

优点：

- 不会污染共享 namespace。
- 网关不会随机把其他人的请求转发到本地电脑。
- 不要求共享环境中的其他服务能够访问 Windows 局域网 IP。

### 10.2 需要注册的场景

只有以下情况才考虑允许注册：

- 需要让共享网关把请求转发到 Windows 本地 XCloud。
- 需要让其他共享服务通过服务名调用本地 XCloud。
- 已确认共享环境能够访问 Windows 注册出去的 IP 和端口。
- 已确认本地防火墙允许入站连接。
- 已与环境使用者协调，避免影响其他开发人员。

建议优先使用独立 namespace 或灰度标识，不要直接污染公共 `mdev` 或 `mtest`。

## 11. 构建命令

在仓库根目录打开 PowerShell。

```powershell
$env:JAVA_HOME = "C:\Program Files\Amazon Corretto\jdk22.0.2_9"
$env:Path = "$env:JAVA_HOME\bin;C:\tools\apache-maven-3.9.x\bin;$env:Path"

mvn `
  -s C:\maven-repos\metis-xcloud\setting.xml `
  -Dmaven.repo.local=C:\maven-repos\metis-xcloud `
  -pl metis-xcloud-boots/metis-xcloud-general `
  -am `
  clean install `
  -DskipTests `
  -Dmaven.test.skip=true `
  -Dmdep.skip=true
```

关键点：

- 从仓库根目录执行。
- 使用 `-am` 同时构建 general 依赖的内部模块。
- 使用项目独立 Maven 本地仓库。
- 不要混用其他工程的 `3.8.3` 内部 JAR。
- 构建前确认 Maven 实际使用 Corretto 22。

## 12. Windows 命令行启动说明

如果使用已经组装好的 release 目录，Windows classpath 使用分号 `;`，不是 macOS/Linux 的冒号 `:`。

示例：

```powershell
& "$env:JAVA_HOME\bin\java.exe" `
  --add-opens=java.base/java.lang=ALL-UNNAMED `
  --add-opens=java.base/java.lang.reflect=ALL-UNNAMED `
  --add-opens=java.base/java.math=ALL-UNNAMED `
  --add-opens=java.base/java.util=ALL-UNNAMED `
  -DNACOS_HOST=<Nacos地址> `
  -DNACOS_PORT=8848 `
  -DNACOS_NS=mdev `
  -DNACOS_PASSWORD=<Nacos密码> `
  -DLOG_MODE=local `
  -Dserver.port=8001 `
  -Dspring.cloud.nacos.discovery.register-enabled=false `
  -Dspring.cloud.service-registry.auto-registration.enabled=false `
  -cp "general\config;general\app.jar;lib\*" `
  com.onepro.metis.xcloud.general.MetisXcloudGeneralApplication
```

必须使用 Maven 处理后的：

```text
target\classes\application.yml
```

不要直接把源码目录中的 `src\main\resources\application.yml` 作为 release 配置，因为其中可能仍包含 Maven 资源占位符。

## 13. 启动验收

### 13.1 健康检查

```powershell
Invoke-RestMethod http://localhost:8001/actuator/health
```

预期总体状态：

```text
UP
```

重点确认：

- `db` 为 `UP`。
- `redis` 为 `UP`。
- `nacosDiscovery` 为 `UP`。
- `nacosConfig` 为 `UP`。

### 13.2 基础接口

```powershell
Invoke-RestMethod "http://localhost:8001/cloud/platform?platformType="
Invoke-RestMethod "http://localhost:8001/cloud/platform?platformType=public"
Invoke-RestMethod "http://localhost:8001/cloud/platform?platformType=private"
```

预期：

- HTTP 状态为 200。
- 返回结果为数组或平台列表结构。
- 日志中没有 `NoSuchMethodError`。
- 日志中没有 `metis-common-service` 实例不存在的 Feign 503。

接口可能受认证和权限控制。若直接访问返回 401 或 403，需要使用有效 Token，或者通过已登录的开发网关调用。

## 14. 常见问题

| 现象 | 优先检查 |
| --- | --- |
| Maven 下载内部依赖失败 | Windows `setting.xml`、Nexus网络、mirror和认证 |
| Maven 使用了错误 JDK | `mvn -version` 中的 Java Home |
| 无法连接 Nacos | VPN、`NACOS_HOST`、8848 端口和 Windows 防火墙 |
| 服务连接到了错误环境 | 是否显式设置 `NACOS_NS=mdev` 或目标 namespace |
| 启动后持续 Feign 503 | 同 namespace 中是否有健康的 `metis-common-service` |
| 数据库连接失败 | Nacos datasource 配置及 Windows 到数据库的网络 |
| Redis 超时 | Redis地址、端口、密码、VPN和访问白名单 |
| Kafka 功能失败 | Kafka broker、认证、Topic 和网络 |
| `NoSuchMethodError` | 是否混用了不同构建批次的同版本内部 JAR |
| 服务启动但共享网关调用不到 | 本地是否注册、注册地址是否可达、防火墙是否放行 |
| 共享环境请求随机进入本机 | 本地实例不应注册，关闭 Nacos 自动注册 |
| 端口被占用 | 修改 `-Dserver.port` 或停止占用进程 |

## 15. 最小准备清单

开始启动前确认：

- [ ] Windows 已连接公司内网或 VPN。
- [ ] 已安装 Amazon Corretto 22。
- [ ] `java -version` 正确。
- [ ] 已安装 Maven 3.9.x。
- [ ] `mvn -version` 使用 Corretto 22。
- [ ] 已准备 Windows 版项目专用 `setting.xml`。
- [ ] 能访问公司 Maven 私服。
- [ ] 能访问目标 Nacos 的 8848 端口。
- [ ] 已确认 Nacos namespace。
- [ ] 已获取 Nacos账号和密码。
- [ ] 必需的 Nacos Data ID 存在。
- [ ] 同 namespace 中存在健康的 `metis-common-service`。
- [ ] MySQL 和 Redis 可从 Windows 访问。
- [ ] 已确认 `8001` 或自定义端口未占用。
- [ ] 默认关闭本地实例向共享 Nacos 注册。
- [ ] 已从根 Maven reactor 构建所需模块。
- [ ] `/actuator/health` 返回 `UP`。
- [ ] 基础云平台接口可以正常访问。

## 16. 推荐实施顺序

1. 安装并验证 Corretto 22、Maven 和 Git。
2. 配置项目专用 Maven settings 和本地仓库。
3. 连接 VPN，验证 Maven 私服和 Nacos 端口。
4. 确认目标 namespace 中的配置和公共服务。
5. 从根工程构建 `metis-xcloud-general` 及其依赖。
6. 在 IntelliJ 中配置 VM Options。
7. 关闭 Nacos 自动注册后启动 general。
8. 验证健康检查和云平台基础接口。
9. 根据调试目标启动对应云厂商模块。
10. 需要共享网关调用时，再评估本地注册和网络回调条件。

## 17. 结论

Windows 本地启动 XCloud 的最低条件不是“在本机安装所有中间件”，而是：

1. 使用 Corretto 22 和 Maven 3.9.x正确构建项目。
2. 使用 Windows 版项目专用 Maven settings 访问内部依赖。
3. Windows 能通过内网或 VPN 访问 Nacos 及其配置指向的基础设施。
4. 目标 namespace 中存在健康的 `metis-common-service`。
5. 默认只读取共享配置和服务发现，不向共享 Nacos 注册本机实例。

在这些条件满足后，只启动 `metis-xcloud-general` 即可覆盖大部分通用管理接口的本地开发与调试；云厂商实时能力再按需启动对应适配服务。
