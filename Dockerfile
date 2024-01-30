#PRE BUILD
FROM node:18-slim as preBuild
WORKDIR /src

RUN apt clean

RUN apt-get update && apt-get install -y \
  pdftk \
  git \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY tsconfig.json ./
COPY /src ./src

RUN yarn

#BUILD
FROM node:18-slim as build
WORKDIR /src

COPY --from=preBuild /src/node_modules ./node_modules
COPY --from=preBuild /src/package.json ./package.json
COPY --from=preBuild /src/yarn.lock ./yarn.lock
COPY --from=preBuild /src/tsconfig.json ./tsconfig.json
COPY --from=preBuild /src ./src

RUN yarn build

COPY /src/View ./dist/View

#COMPLETE BUILD
FROM node:18-slim
WORKDIR /src

COPY --from=build /src/dist/ ./
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/package.json ./package.json
COPY --from=build /src/yarn.lock ./yarn.lock
COPY --from=build /src/tsconfig.json ./tsconfig.json

RUN yarn global add pm2

EXPOSE 8080 443

CMD yarn start