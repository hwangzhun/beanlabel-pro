#!/bin/bash

# BeanLabel Pro - 安装系统依赖脚本
# 用于在 Linux 服务器上安装 Puppeteer/Chrome 所需的系统依赖

set -e

echo "========================================="
echo "  BeanLabel Pro - 安装系统依赖"
echo "========================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "无法检测操作系统类型"
    exit 1
fi

echo "检测到操作系统: $OS $VER"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 安装依赖函数
install_deps_ubuntu_debian() {
    echo "正在安装依赖 (Ubuntu/Debian)..."
    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils
}

install_deps_centos_rhel() {
    echo "正在安装依赖 (CentOS/RHEL)..."
    sudo yum install -y \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        ipa-gothic-fonts \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-utils \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-Type1 \
        xorg-x11-fonts-misc
}

install_deps_alpine() {
    echo "正在安装依赖 (Alpine)..."
    apk add --no-cache \
        chromium \
        nss \
        freetype \
        freetype-dev \
        harfbuzz \
        ca-certificates \
        ttf-freefont \
        ttf-liberation
}

# 安装中文字体
install_chinese_fonts() {
    echo ""
    echo "安装中文字体..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get install -y fonts-wqy-microhei fonts-wqy-zenhei || true
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
        sudo yum install -y wqy-microhei-fonts wqy-zenhei-fonts || true
    else
        echo -e "${YELLOW}警告: 无法自动安装中文字体，请手动安装${NC}"
    fi
}

# 根据操作系统安装依赖
case "$OS" in
    ubuntu|debian)
        install_deps_ubuntu_debian
        install_chinese_fonts
        ;;
    centos|rhel|fedora)
        install_deps_centos_rhel
        install_chinese_fonts
        ;;
    alpine)
        install_deps_alpine
        ;;
    *)
        echo -e "${RED}错误: 不支持的操作系统: $OS${NC}"
        echo "请手动安装 Chrome/Chromium 所需的依赖库"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""
echo "下一步："
echo "1. 如果使用 Puppeteer 自带的 Chrome，重启应用即可"
echo "2. 如果系统已安装 Chrome/Chromium，可以设置环境变量："
echo "   export CHROME_PATH=/usr/bin/chromium-browser"
echo "   或"
echo "   export CHROME_PATH=/usr/bin/google-chrome"
echo ""
echo "然后重启应用："
echo "   pm2 restart beanlabel-pro"

