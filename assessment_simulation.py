"""
围棋自适应棋力测评算法验证模拟
- 题库结构：按级位分桶（20/15/12/10/7/5 级）
- 每级假设题目数量充足（≥80 题）
- 用蒙特卡洛模拟不同真实棋力学员的测评过程
"""
import random
import statistics
from collections import defaultdict, Counter

# ============ 配置 ============
LEVELS = [20, 15, 12, 10, 7, 5]          # 级位，数字越小越强
LEVEL_IDX = {lv: i for i, lv in enumerate(LEVELS)}
INITIAL_LEVEL = 12
MAX_QUESTIONS = 40
MIN_QUESTIONS = 12
BANK_SIZE_PER_LEVEL = 100                 # 每级题库大小

# 真实棋力为 T 时，在当前级别 L 的答对概率
# P = clamp(0.8 - 0.25 * (L_index - T_index), 0.1, 0.95)
def correct_prob(true_level, current_level):
    d = LEVEL_IDX[current_level] - LEVEL_IDX[true_level]
    return max(0.10, min(0.95, 0.80 - 0.25 * d))

# ============ 算法实现（完全按你给的伪代码） ============
def run_assessment(true_level, seed=None):
    rng = random.Random(seed)
    current_level = INITIAL_LEVEL
    # 统计：{level: {'对': int, '错': int}}
    stats = {lv: {'对': 0, '错': 0} for lv in LEVELS}
    consecutive = 0
    history = []  # 记录每题 (题号, 级别, 结果)

    for i in range(1, MAX_QUESTIONS + 1):
        # 1. 从当前级别未做题中随机抽（这里简化为可重复随机，因题库足够大）
        result = '对' if rng.random() < correct_prob(true_level, current_level) else '错'

        # 2. 更新统计
        stats[current_level][result] += 1
        history.append((i, current_level, result))

        if result == '对':
            consecutive = max(consecutive, 0) + 1
        else:
            consecutive = min(consecutive, 0) - 1

        # 3. 升降级判断
        if consecutive >= 2 and current_level != LEVELS[-1]:
            current_level = LEVELS[LEVEL_IDX[current_level] + 1]
            consecutive = 0
        elif consecutive <= -2 and current_level != LEVELS[0]:
            current_level = LEVELS[LEVEL_IDX[current_level] - 1]
            consecutive = 0

        # 4. 提前终止（收敛判定）
        if i >= MIN_QUESTIONS:
            stable = find_stable_level(stats)
            if stable is not None:
                return {
                    'true_level': true_level,
                    'stable_level': stable,
                    'questions': i,
                    'stats': stats,
                    'history': history,
                }

    return {
        'true_level': true_level,
        'stable_level': find_stable_level(stats),  # 可能为 None
        'questions': MAX_QUESTIONS,
        'stats': stats,
        'history': history,
    }


def find_stable_level(stats):
    """
    找到最高稳定级别：
    - 该级别做对≥3题且正确率≥60%
    - 同时存在更高级别做错≥2题（最顶级 5 级除外，直接判定自身）
    """
    for idx in range(len(LEVELS) - 1, -1, -1):
        lv = LEVELS[idx]
        s = stats[lv]
        total = s['对'] + s['错']
        if total == 0:
            continue
        if s['对'] >= 3 and s['对'] / total >= 0.60:
            # 最顶级没有更高级别，直接收敛
            if lv == LEVELS[-1]:
                return lv
            # 检查是否存在更高级别做错≥2题
            for higher_idx in range(idx + 1, len(LEVELS)):
                higher_lv = LEVELS[higher_idx]
                if stats[higher_lv]['错'] >= 2:
                    return lv
    return None


# ============ 蒙特卡洛 ============
def simulate(n_runs=1000):
    rows = []
    for true_lv in LEVELS:
        results = [run_assessment(true_lv, seed=i * 100 + LEVEL_IDX[true_lv]) for i in range(n_runs)]

        questions = [r['questions'] for r in results]
        stable_levels = [r['stable_level'] for r in results]
        none_count = sum(1 for x in stable_levels if x is None)

        exact = sum(1 for x in stable_levels if x == true_lv)
        within1 = sum(1 for x in stable_levels
                      if x is not None and abs(LEVEL_IDX[x] - LEVEL_IDX[true_lv]) <= 1)

        rows.append({
            '真实棋力': true_lv,
            '样本数': n_runs,
            '未收敛': none_count,
            '精确匹配': exact,
            '精确匹配率': exact / n_runs,
            '±1级匹配': within1,
            '±1级匹配率': within1 / n_runs,
            '平均题数': statistics.mean(questions),
            '中位题数': statistics.median(questions),
            '最终分布': Counter(stable_levels),
        })
    return rows


def print_report(rows):
    print("=" * 90)
    print("自适应测评算法蒙特卡洛验证报告（每真实棋力运行 1000 次）")
    print("=" * 90)
    for r in rows:
        print(f"\n真实棋力：{r['真实棋力']}级")
        print(f"  平均题数：{r['平均题数']:.1f}   中位题数：{r['中位题数']:.0f}")
        print(f"  精确匹配：{r['精确匹配']} / {r['样本数']} ({r['精确匹配率']*100:.1f}%)")
        print(f"  ±1 级匹配：{r['±1级匹配']} / {r['样本数']} ({r['±1级匹配率']*100:.1f}%)")
        print(f"  未收敛（跑满 {MAX_QUESTIONS} 题）：{r['未收敛']} ({r['未收敛']/r['样本数']*100:.1f}%)")
        print(f"  最终判定分布：{dict(sorted(r['最终分布'].items(), key=lambda kv: LEVEL_IDX.get(kv[0], 99)))}")


if __name__ == '__main__':
    rows = simulate(n_runs=1000)
    print_report(rows)

    # 额外打印一次典型轨迹，便于直观理解
    print("\n" + "=" * 90)
    print("示例轨迹：真实棋力 10 级")
    print("=" * 90)
    demo = run_assessment(10, seed=42)
    for i, lv, res in demo['history']:
        print(f"  第{i:2d}题  {lv}级  {res}")
    print(f"\n最终判定：{demo['stable_level']}级  总题数：{demo['questions']}")
