
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Papa from 'papaparse';
import './index.css';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// --- Helper: Highlight Numbers ---
const highlightNumbers = (text: string) => {
  if (!text || typeof text !== 'string') return text;
  const regex = /(\d+(?:[:~.]\d+)*)/g;
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <span key={i} className="font-bold text-foreground">{part}</span> : part
  );
};

// --- Interfaces ---
interface LottoHistory {
  '회차': number;
  '추첨일': string;
  '1등_총당첨금': number;
  '1등_당첨인원': number;
  '번호1': number;
  '번호2': number;
  '번호3': number;
  '번호4': number;
  '번호5': number;
  '번호6': number;
  '보너스': number;
}

interface GeneratedSet {
  id: string;
  numbers: number[];
  reason?: string;
  sum?: number;
  matchRound?: number | null;
}

interface Insight {
  title: string;
  bullets?: string[];
  description?: string;
  tag: string;
}

interface AnalysisData {
  hotNumbers: { number: number; count: number }[];
  coldNumbers: { number: number; count: number }[];
  insights: Insight[];
}

// --- Shared Components ---
const LottoBall: React.FC<{ number: number; size?: 'sm' | 'md' | 'lg' }> = ({ number, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const getColorClass = (n: number) => {
    if (n <= 10) return 'bg-yellow-400 text-yellow-900';
    if (n <= 20) return 'bg-blue-400 text-blue-900';
    if (n <= 30) return 'bg-rose-400 text-rose-900';
    if (n <= 40) return 'bg-gray-400 text-gray-900';
    return 'bg-emerald-400 text-emerald-900';
  };

  return (
    <div className={`${sizes[size]} ${getColorClass(number)} font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white/50`}>
      {number}
    </div>
  );
};

// 1. HOME TAB
const HomeTab: React.FC<{ lottoHistory: LottoHistory[] }> = ({ lottoHistory }) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  if (lottoHistory.length === 0) {
    return <div className="text-center p-10">데이터를 불러오는 중입니다...</div>;
  }

  const latestData = lottoHistory[currentRoundIndex];
  const totalRounds = lottoHistory.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samantha" />
            <AvatarFallback>USER</AvatarFallback>
          </Avatar>
          <p className="font-medium">안녕하세요 <span className="font-bold">행운님</span></p>
        </div>
        <Button variant="ghost" size="icon"><i className="fa-regular fa-bell text-lg"></i></Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold leading-tight">이번 주 로또 리포트</h1>
        <p className="text-muted-foreground">최신 당첨 정보를 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="col-span-1 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">1등 총 당첨금</CardTitle>
            <CardDescription>First Prize Pool</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{(latestData['1등_총당첨금'] / 100000000).toFixed(0)}억</p>
          </CardContent>
        </Card>
        <Card className="col-span-1 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">1등 당첨 인원</CardTitle>
            <CardDescription>Number of Winners</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{latestData['1등_당첨인원']}명</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{latestData['회차']}회 당첨번호</CardTitle>
          <CardDescription>{latestData['추첨일']}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center items-center gap-3">
            {[...Array(6)].map((_, i) => (
                <LottoBall key={i} number={latestData[`번호${i + 1}` as keyof LottoHistory] as number} size="md" />
            ))}
            <span className="text-2xl font-bold text-muted-foreground mx-2">+</span>
            <LottoBall number={latestData['보너스']} size="md" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentRoundIndex(i => Math.min(i + 1, totalRounds - 1))} disabled={currentRoundIndex >= totalRounds - 1}>이전</Button>
          <span className="text-sm font-medium text-muted-foreground">Round {latestData['회차']}</span>
          <Button variant="outline" onClick={() => setCurrentRoundIndex(i => Math.max(i - 1, 0))} disabled={currentRoundIndex <= 0}>다음</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// 2. ANALYSIS TAB
const AnalysisTab: React.FC<{ lottoHistory: LottoHistory[] }> = ({ lottoHistory }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);

  const handleAnalyze = () => {
    if (lottoHistory.length === 0) return;
    setAnalyzing(true);
    
    const numberCounts: { [key: number]: number } = {};
    for (let i = 1; i <= 45; i++) {
        numberCounts[i] = 0;
    }

    lottoHistory.forEach(row => {
        for (let i = 1; i <= 6; i++) {
            const num = row[`번호${i}` as keyof LottoHistory] as number;
            if (num) numberCounts[num]++;
        }
    });

    const sortedNumbers = Object.entries(numberCounts).sort(([, countA], [, countB]) => countA - countB);
    
    const coldNumbers = sortedNumbers.slice(0, 6).map(([num, count]) => ({ number: Number(num), count }));
    const hotNumbers = sortedNumbers.slice(-6).reverse().map(([num, count]) => ({ number: Number(num), count }));

    const insights: Insight[] = [
        {title: "번호 합계 구간", bullets: ["최근 10주간 번호 합이 130-160 사이에서 자주 출현했습니다.", "다음 회차에서도 비슷한 구간을 노려보는 것이 좋습니다."], tag: "130 ~ 160"},
        {title: "홀짝 비율", bullets: ["최근 홀수와 짝수의 비율은 3:3 또는 4:2가 가장 많았습니다.", "극단적인 비율은 피하는 것이 현명합니다."], tag: "3:3 or 4:2"},
        {title: "연속 번호 패턴", bullets: ["연속 번호 출현 빈도가 감소하는 추세입니다.", "한 쌍 정도의 연속 번호는 고려해볼 만합니다."], tag: "1-2 쌍"},
    ];

    setTimeout(() => {
        setData({ hotNumbers, coldNumbers, insights });
        setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">데이터 분석</h2>
      <Card>
        <CardHeader>
          <CardTitle>전체 회차 데이터 분석</CardTitle>
          <CardDescription>{`총 ${lottoHistory.length}회차의 데이터를 기반으로 번호 출현 빈도를 분석합니다.`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} disabled={analyzing || lottoHistory.length === 0} className="w-full">
            {analyzing ? <><i className="fas fa-sync fa-spin mr-2"></i> 분석중...</> : '분석 실행하기'}
          </Button>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <Card>
                  <CardHeader><CardTitle>최다 출현 (HOT)</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                      {data.hotNumbers.map((n, i) => <LottoBall key={i} number={n.number} size="sm" />)}
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>미출현 (COLD)</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                      {data.coldNumbers.map((n, i) => <LottoBall key={i} number={n.number} size="sm" />)}
                  </CardContent>
              </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>AI 핵심 인사이트 (예시)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{insight.title}</h4>
                    <Badge variant="secondary">{insight.tag}</Badge>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {insight.bullets?.map((bullet, i) => <li key={i}>{highlightNumbers(bullet)}</li>)}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// 3. GENERATE TAB
const GenerateTab: React.FC<{ onSave: (set: GeneratedSet) => void, lottoHistory: LottoHistory[] }> = ({ onSave, lottoHistory }) => {
  const [generated, setGenerated] = useState<GeneratedSet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [minSum, setMinSum] = useState<number>(100);
  const [maxSum, setMaxSum] = useState<number>(170);

  const checkPastMatch = (nums: number[]): number | null => {
      const sortedTarget = [...nums].sort((a, b) => a - b).join(',');
      for (const past of lottoHistory) {
          const pastNumbers = [past['번호1'], past['번호2'], past['번호3'], past['번호4'], past['번호5'], past['번호6']];
          const sortedPast = [...pastNumbers].sort((a, b) => a - b).join(',');
          if (sortedTarget === sortedPast) return past['회차'];
      }
      return null;
  };

  const handleGenerate = async (mode: 'random' | 'ai' | 'sum') => {
    setIsGenerating(true);
    setGenerated([]);
    await new Promise(r => setTimeout(r, 1000));
    let newSets: GeneratedSet[] = [];
     Array.from({length: 3}, (_, i) => {
        const nums = new Set<number>();
        while(nums.size < 6) nums.add(Math.floor(Math.random() * 45) + 1);
        const sorted = Array.from(nums).sort((a,b) => a-b);
        const s = sorted.reduce((a, b) => a + b, 0);
        newSets.push({ id: `${mode}-${Date.now()}-${i}`, numbers: sorted, reason: `${mode} 조합`, sum: s, matchRound: checkPastMatch(sorted) });
    });
    setGenerated(newSets);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">번호 생성</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" size="lg" onClick={() => handleGenerate('random')}>랜덤 생성</Button>
        <Button variant="outline" size="lg" onClick={() => handleGenerate('ai')}>AI 추천</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>합계 구간 설정</CardTitle>
          <CardDescription>원하는 합계 범위를 직접 지정하여 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input type="number" value={minSum} onChange={e => setMinSum(Number(e.target.value))} placeholder="최소값" />
          <span className="text-muted-foreground">-</span>
          <Input type="number" value={maxSum} onChange={e => setMaxSum(Number(e.target.value))} placeholder="최대값" />
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={() => handleGenerate('sum')}>범위 내 번호 생성</Button>
        </CardFooter>
      </Card>

      {isGenerating && <div className="text-center p-10">생성중...</div>}
      
      <div className="space-y-4">
        {generated.map(set => (
          <Card key={set.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                 <CardTitle className="text-base">{set.reason}</CardTitle>
                 {set.matchRound ? (
                    <Badge variant="destructive">기록 있음 ({set.matchRound}회)</Badge>
                 ) : (
                    <Badge variant="secondary">새로운 조합</Badge>
                 )}
              </div>
              <CardDescription>합계: {set.sum}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 justify-center">
              {set.numbers.map((n, i) => <LottoBall key={i} number={n} size="sm" />)}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full" onClick={() => onSave(set)}>보관함에 저장</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// 4. BOOKMARKS TAB
const BookmarksTab: React.FC<{ bookmarks: GeneratedSet[], onRemove: (id: string) => void }> = ({ bookmarks, onRemove }) => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold">보관함</h2>
        {bookmarks.length === 0 ? (
            <Card className="text-center p-12">
                <CardContent>
                    <p className="text-muted-foreground">보관된 번호가 없습니다.</p>
                </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
                {bookmarks.map(set => (
                    <Card key={set.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {set.numbers.map((n, i) => <LottoBall key={i} number={n} size="sm" />)}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => onRemove(set.id)}>
                                <i className="fas fa-trash-alt text-destructive"></i>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
);

// --- APP ---
const App = () => {
  const [bookmarks, setBookmarks] = useState<GeneratedSet[]>([]);
  const [lottoHistory, setLottoHistory] = useState<LottoHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('lotto_bookmarks');
    if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks);
        if (Array.isArray(parsed)) setBookmarks(parsed);
    }

    Papa.parse('/lotto_full_history.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => {
            const transformedData = results.data.map((row: any) => {
                if (!row['회차']) return null;
                const numbers = row['당첨번호'].split(',').map(Number);
                return {
                    '회차': row['회차'],
                    '추첨일': row['추첨일'],
                    '1등_총당첨금': row['1등_총당첨금액'],
                    '1등_당첨인원': row['1등_당첨게임수'],
                    '번호1': numbers[0],
                    '번호2': numbers[1],
                    '번호3': numbers[2],
                    '번호4': numbers[3],
                    '번호5': numbers[4],
                    '번호6': numbers[5],
                    '보너스': row['보너스번호'],
                };
            }).filter(Boolean); // null 값 제거

            const sortedData = (transformedData as LottoHistory[]).sort((a, b) => b['회차'] - a['회차']);
            setLottoHistory(sortedData);
            setLoading(false);
        },
        error: (err) => {
            console.error("CSV 파싱 에러:", err);
            setLoading(false);
        }
    });

  }, []);

  const saveToBookmarks = (set: GeneratedSet) => {
      if (bookmarks.find(b => b.id === set.id)) return;
      const updated = [set, ...bookmarks];
      setBookmarks(updated);
      localStorage.setItem('lotto_bookmarks', JSON.stringify(updated));
  };

  const removeFromBookmarks = (id: string) => {
      const updated = bookmarks.filter(b => b.id !== id);
      setBookmarks(updated);
      localStorage.setItem('lotto_bookmarks', JSON.stringify(updated));
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩중...</div>
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background text-foreground flex flex-col p-4 pb-8">
      <Tabs defaultValue="home" className="flex flex-col flex-grow relative">
        <div className="flex-grow overflow-y-auto">
          <TabsContent value="home" className="flex-grow"><HomeTab lottoHistory={lottoHistory} /></TabsContent>
          <TabsContent value="analysis" className="flex-grow"><AnalysisTab lottoHistory={lottoHistory} /></TabsContent>
          <TabsContent value="generate" className="flex-grow"><GenerateTab onSave={saveToBookmarks} lottoHistory={lottoHistory} /></TabsContent>
          <TabsContent value="bookmarks" className="flex-grow"><BookmarksTab bookmarks={bookmarks} onRemove={removeFromBookmarks} /></TabsContent>
        </div>
        
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md">
          <TabsList className="grid w-full grid-cols-4 h-14 rounded-full bg-muted p-1 shadow-lg">
            <TabsTrigger value="home"><i className="fa-solid fa-trophy text-xl"></i></TabsTrigger>
            <TabsTrigger value="analysis"><i className="fa-solid fa-database text-xl"></i></TabsTrigger>
            <TabsTrigger value="generate"><i className="fa-solid fa-fan text-xl"></i></TabsTrigger>
            <TabsTrigger value="bookmarks"><i className="fa-solid fa-heart text-xl"></i></TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
