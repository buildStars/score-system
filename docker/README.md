# Docker 配置文件说明

此目录包含 Docker 相关的配置文件和初始化脚本。

## 目录结构

```
docker/
├── mysql/
│   └── init/
│       └── 01-init.sql    # MySQL 初始化脚本
└── README.md              # 本文件
```

## MySQL 初始化

`mysql/init/` 目录下的 SQL 文件会在 MySQL 容器首次启动时自动执行。

文件按字母顺序执行，因此建议使用数字前缀来控制执行顺序：
- `01-init.sql` - 基础初始化
- `02-data.sql` - 初始数据（如果需要）

## 使用说明

这些配置文件已经在 `docker-compose.yml` 中配置好了，无需手动操作。

当你运行 `docker-compose up -d` 时，这些脚本会自动执行。

## 注意事项

- ⚠️ 初始化脚本只在首次启动时执行
- ⚠️ 如果需要重新执行，请删除 MySQL 数据卷：`docker-compose down -v`
- ⚠️ 数据库迁移由 Prisma 管理，会在后端服务启动时自动执行










