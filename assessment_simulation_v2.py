"""
自适应测评算法改进版模拟（用于与原算法对比）
改进点：
1. 更陡峭的答对概率曲线，更好地区分相邻级位
2. 收敛判定兼容边界（最弱/最强级）
3. 允许在“相邻更高级别明显不会”时立即收敛
"""
import random
import statistics
from collections import Counter

LEVELS = [20, 15, 12, 10, 7, 5]
LEVEL_IDX = {lv: i for i, lv in enumerate(LEVELS)}
INITIAL_LEVEL = 12
MAX_QUESTIONS = 40
MIN_QUESTIONS = 12

# 更陡峭的区分度：同级 75%，上一级 40%，上两级 5%
def correct_prob(true_level, current_level):
    d = LEVEL_IDX[current_level] - LEVEL_IDX[true_level]
    return max(0.05, min(0.95, 0.75 - 0.35 * d))


def run_assessment(true_level, seed=None, improved=False):
    rng = random.Random(seed)
    current_level = INITIAL_LEVEL
    stats = {lv: {'对': 0, '错': 0} for lv in LEVELS}
    consecutive = 0
    history = []

    for i in range(1, MAX_QUESTIONS + 1):
        result = '对' if rng.random() < correct_prob(true_level, current_level) else '错'
        stats[current_level][result] += 1
        history.append((i, current_level, result))

        if result == '对':
            consecutive = max(consecutive, 0) + 1
        else:
            consecutive = min(consecutive, 0) - 1

        if consecutive >= 2 and current_level != LEVELS[-1]:
            current_level = LEVELS[LEVEL_IDX[current_level] + 1]
            consecutive = 0
        elif consecutive <= -2 and current_level != LEVELS[0]:
            current_level = LEVELS[LEVEL_IDX[current_level] - 1]
            consecutive = 0

        if i >= MIN_QUESTIONS:
            stable = find_stable_level_improved(stats) if improved else find_stable_level_original(stats)
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
        'stable_level': (find_stable_level_improved(stats) if improved
                         else find_stable_level_original(stats)),
        'questions': MAX_QUESTIONS,
        'stats': stats,
        'history': history,
    }


def find_stable_level_original(stats):
    """原算法收敛判定"""
    for idx in range(len(LEVELS) - 1, -1, -1):
        lv = LEVELS[idx]
        s = stats[lv]
        total = s['对'] + s['错']
        if total == 0:
            continue
        if s['对'] >= 3 and s['对'] / total >= 0.60:
            if lv == LEVELS[-1]:
                return lv
            for higher_idx in range(idx + 1, len(LEVELS)):
                if stats[LEVELS[higher_idx]]['错'] >= 2:
                    return lv
    return None


def find_stable_level_improved(stats):
    """改进版收敛判定：
    - 最高级 5 级：自身正确率≥60% 且≥3 题即可
    - 其他级别 L：自身正确率≥60% 且≥3 题，并且相邻更高级 L+ 被测试过且正确率<50%
    - 最弱级 20 级：额外允许“已经答过≥5 题且正确率≥60%，且没有更高级表现更好”时收敛
    """
    rates = {}
    totals = {}
    for lv in LEVELS:
        totals[lv] = stats[lv]['对'] + stats[lv]['错']
        if totals[lv] > 0:
            rates[lv] = stats[lv]['对'] / totals[lv]

    # 从强到弱扫描，找最高稳定级
    for idx in range(len(LEVELS) - 1, -1, -1):
        lv = LEVELS[idx]
        if totals[lv] < 3 or rates.get(lv, 0) < 0.60:
            continue

        # 最强级直接收敛
        if lv == LEVELS[-1]:
            return lv

        # 相邻更高级别是否“明显不会”
        higher = LEVELS[idx + 1]
        if totals[higher] >= 2 and rates.get(higher, 1.0) < 0.50:
            return lv

    # 兜底：最弱级如果已经答了很多题且表现好，但一直没法触发上面的条件
    # 说明学生可能就是 20 级，只是 upstairs 的样本不够
    lv20 = LEVELS[0]
    if totals[lv20] >= 5 and rates.get(lv20, 0) >= 0.60:
        # 确保没有更高级别表现也好的
        if not any(rates.get(l, 0) >= 0.60 for l in LEVELS[1:] if totals[l] >= 3):
            return lv20

    return None


def simulate(n_runs=1000, improved=False):
    rows = []
    for true_lv in LEVELS:
        results = [run_assessment(true_lv, seed=i * 100 + LEVEL_IDX[true_lv], improved=improved)
                   for i in range(n_runs)]
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


def print_report(rows, title):
    print("=" * 95)
    print(title)
    print("=" * 95)
    for r in rows:
        print(f"\n真实棋力：{r['真实棋力']}级")
        print(f"  平均题数：{r['平均题数']:.1f}   中位题数：{r['中位题数']:.0f}")
        print(f"  精确匹配：{r['精确匹配']} / {r['样本数']} ({r['精确匹配率']*100:.1f}%)")
        print(f"  ±1 级匹配：{r['±1级匹配']} / {r['样本数']} ({r['±1级匹配率']*100:.1f}%)")
        print(f"  未收敛（跑满 {MAX_QUESTIONS} 题）：{r['未收敛']} ({r['未收敛']/r['样本数']*100:.1f}%)")
        print(f"  最终判定分布：{dict(sorted(r['最终分布'].items(), key=lambda kv: LEVEL_IDX.get(kv[0], 99)))}")


if __name__ == '__main__':
    print("\n\n")
    rows_orig = simulate(n_runs=1000, improved=False)
    print_report(rows_orig, "原算法 + 更陡峭难度曲线（用于公平对比）")

    print("\n\n")
    rows_imp = simulate(n_runs=1000, improved=True)
    print_report(rows_imp, "改进版算法 + 更陡峭难度曲线")

    print("\n\n")
    print("=" * 95)
    print("对比摘要")
    print("=" * 95)
    for o, n in zip(rows_orig, rows_imp):
        print(f"真实 {o['真实棋力']:2d}级 | 原精确 {o['精确匹配率']*100:5.1f}% | 改进精确 {n['精确匹配率']*100:5.1f}% | "
              f"原±1 {o['±1级匹配率']*100:5.1f}% | 改进±1 {n['±1级匹配率']*100:5.1f}% | "
              f"原平均题数 {o['平均题数']:4.1f} | 改进平均题数 {n['平均题数']:4.1f}")
