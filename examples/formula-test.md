---
title: 公式渲染综合测试页
date: 2024-01-01
tags: [公式, LaTeX, KaTeX, 测试]
excerpt: 覆盖原博客全部 LaTeX 公式形式：各种定界符、环境、宏与中文混排。
---

# 公式渲染综合测试页

本页覆盖原博客（huluoboge.github.io）中出现的**全部** LaTeX 公式形式，
用于回归验证渲染器对各种公式写法的支持。渲染要求：**零泄漏**（所有公式
都被 KaTeX 解析，原始定界符不出现于页面文本）。

## 1. 行内公式

### 1.1 美元符号 `$...$`

行内公式如 $E = mc^2$，以及带上下标的 $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$、
积分 $\int_{a}^{b} f(x) dx$、极限 $\lim_{x \to 0} \frac{\sin x}{x} = 1$、
偏导 $\frac{\partial f}{\partial x}$。

### 1.2 圆括号 `\(...\)`

矩阵乘积 \(C = A B\) 为：行内圆括号公式 \(E = mc^2\) 与
\(\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}\)。

## 2. 块级公式

### 2.1 双美元 `$$...$$`

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

这是高斯积分公式，块级公式应单独成行并居中显示。

### 2.2 方括号 `\[...\]`

\[ \mathcal{L}(\mathcal{X},\mathcal{X}^{\prime},\mathcal{D},\mathcal{D}^{\prime};Y,Y^{\prime},S) = \mathcal{L}_{p}(\mathcal{X},Y) + \mathcal{L}_{p}(\mathcal{X}^{\prime},Y^{\prime}) + \lambda\mathcal{L}_{d}(\mathcal{D},\mathcal{D}^{\prime},S) \quad (1) \]

兴趣点检测器损失函数 $\mathcal{L}_p$ 是单元 $x_{hw} \in \mathcal{X}$ 上的全卷积交叉熵损失：

\[ \mathcal{L}_{p}(\mathcal{X},Y) = \frac{1}{H_{c}W_{c}} \sum_{h=1}^{H_{c}} \sum_{w=1}^{W_{c}} l_{p}(x_{hw}; y_{hw}) \quad (2) \]

## 3. 数学环境

### 3.1 equation 环境（`$$` 包裹）

$$
\begin{equation}
\nabla (\chi_M * \tilde{F})(q_0)
= \int_{\partial M} \tilde{F}_p(q_0)\, \mathbf{N}_{\partial M}(p)\, dp
\end{equation}
$$

### 3.2 align* 环境

$$
\begin{align*}
T(\infty)&=T\left(-\infty, t^*\right)\times T\left(t^*,+\infty\right)\\
&=e^{-\int_{-\infty}^{t^*}\sigma(x(s),\omega)}\times e^{-\int_{t^*}^{+\infty}\sigma(x(s),\omega)}\\
&=e^{-\left(-\log(v(t))\left.\right|_{-\infty}^*\right)}\times\left.e^{-\left(\log(v(t))\left|_{t^*}^{+\infty}\right.\right)}\right.\\
&=\frac{v\left(t^*\right)}{v(-\infty)}\times\frac{v\left(t^*\right)}{v(+\infty)}\\
&=v\left(t^*\right)^2\\
C&=c(1-T(+\infty))=c\left(1-v\left(t^*\right)^2\right),
\end{align*}
$$

### 3.3 aligned 环境

$$
\begin{aligned}
\sigma(t)&=|\omega\cdot\nabla\log(v(x))|\\
&=\left|\frac{\partial\log(v(x))}{\partial t}\right|\\
&=\left\{\begin{array}{ll}-\frac{\partial\log(v(x))}{\partial t},& t\leq t^{*}\\ \frac{\partial\log(v(x))}{\partial t},& t>t^{*}\end{array}\right.
\end{aligned}
$$

### 3.4 bmatrix 矩阵

$$
A =
\begin{bmatrix}
a_{11} & a_{12} & \dots & a_{1n} \\
a_{21} & a_{22} & \dots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \dots & a_{mn}
\end{bmatrix}
$$

### 3.5 cases 环境

$$
f(x) =
\begin{cases}
x^2, & x > 0 \\
0, & x = 0 \\
-x^2, & x < 0
\end{cases}
$$

### 3.6 array 环境（含中文注释）

$$
T_i(t)=\left\{\begin{array}{ll} v_i(t),& t\leq t_i^*\\ v_i\left(t_i^*\right)^2/ v_i(t),& t>t_i^*.\end{array}\right.
$$

## 4. 特殊宏

### 4.1 \operatorname / \text

$$
V(q) \equiv \sum_{s \in S} \sum_{o \in \text{Ngbr}^D(s)} \alpha_{o,s} F_o(q) s.\mathbf{N} \tag{3}
$$

其中 $\text{Ngbr}^D(s)$ 是距离 $s.p$ 最近的八个深度 $D$ 节点，
$\{\alpha_{o,s}\}$ 是三线性插值权重。

$\operatorname{argmax}$ 与自定义算子：

$$
\tilde{F}(q) = \sum_{s \in S} \alpha_{o,s} \operatorname{avg}_{o \in \text{Ngbr}^D(s)} F_o(q)
$$

### 4.2 \underbrace（中文下括号）

$$B_n(x) = \underbrace{(b * b * \cdots * b)}_{n+1 \text{ 次}}$$

其中 $b(x)$ 是 **box filter（单位宽度的矩形函数）**。

### 4.3 \binom 组合数

$$
\begin{equation}
P_e =\frac{\binom{pn}{k}}{\binom{n}{k}}
\end{equation}
$$

### 4.4 \mathbb / \mathcal / \mathbf

$$
\mathbb{R}^n \ni \mathbf{x}, \quad \mathcal{L} = \frac{1}{2} (\partial_\mu \phi)^2 - \frac{1}{2} m^2 \phi^2 - \frac{\lambda}{4!} \phi^4
$$

## 5. 中文混排公式

泊松重建中，指示函数 $\chi_M$ 的梯度 $\nabla \chi_M$ 等于表面法向量场
$\mathbf{N}_{\partial M}$ 的积分：

$$
\nabla (\chi_M * \tilde{F})(q) = \sum_{s \in S} \int_{P_s} \tilde{F}_p(q) \mathbf{N}_{\partial M}(p) dp \approx \sum_{s \in S} |P_s| \tilde{F}_{s.p}(q) s.\mathbf{N} \equiv V(q). \tag{2}
$$

应该注意的是，尽管方程 (1) 对任何平滑滤波器 $\tilde{F}$ 都是正确的，
但在实践中，必须小心选择滤波器。

## 6. 嵌套环境（align* 内嵌 array）

$$
\begin{align*}
\sigma(t)&=|\omega\cdot\nabla\log(v(x))|\\
&=\left|\frac{\partial\log(v(x))}{\partial t}\right|\\
&=\left\{\begin{array}{ll}-\frac{\partial\log(v(x))}{\partial t},& t\leq t^{*}\\ \frac{\partial\log(v(x))}{\partial t},& t>t^{*}\end{array}\right.\end{align*}
$$

## 7. 代码块中的公式（不应被渲染）

```latex
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

以上代码块中的公式应以纯文本显示，不能被 KaTeX 解析。

## 8. 常见数学符号

- 求和：$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$
- 积分：$\int_{a}^{b} f(x) dx$
- 极限：$\lim_{x \to 0} \frac{\sin x}{x} = 1$
- 偏导数：$\frac{\partial f}{\partial x}$
- 梯度算子：$\nabla f = \left( \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \dots \right)$
- 向量范数：$\|\mathbf{v}\|_2 = \sqrt{\sum_i v_i^2}$

## 9. 公式块与文本混排（原博客真实段落）

**证明**：为了证明这一点，我们展示向量场的每个分量的相等性。计算平滑指示函数关于 $x$ 的偏导数，我们得到：

$$
\begin{equation}
\nabla (\chi_M * \tilde{F})(q_0)
= \int_{\partial M} \tilde{F}_p(q_0)\, \mathbf{N}_{\partial M}(p)\, dp
\end{equation}
$$

这里，$t_{i}^{*}$ 是高斯沿相机光线的最大值点。公式 12 是根据公式 3 中定义的每个高斯内部的连续衰减剖面推导出来的，捕捉了更详细的几何信息。
