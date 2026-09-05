import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-load Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback generator for rich, hilarious Chinese apologies
const FALLBACK_TEMPLATES: Record<string, (recipient: string, offense: string, penalty: string) => string> = {
  imperial: (r, o, p) => `【紫禁城请罪奏折 · 罪己诏】
奉天承运，皇帝诏曰（划掉），罪臣/臣妾顿首再拜！

伏望【${r}】：
臣妾万死，罪无可恕！臣妾今日犯下滔天大罪——竟因【${o}】而惹恼了尊前！每念及此，五内俱焚，寝食难安。臣妾深知六宫之内，唯有您明察秋毫、恩泽万方。今日之过，皆因臣妾一时猪油蒙心、头脑发昏！

为此，臣妾甘愿自领惩戒：【${p}】！
若有半句怨言，天打五雷轰，罚臣妾以后吃螺蛳粉没有酸笋，喝奶茶吸不到珍珠！
伏乞【${r}】念在臣妾侍奉多年的苦劳份上，赐下一丝温存，臣妾定当感激涕零，结草衔环，以报圣恩！

钦此！请罪人涕泣顿首。`,

  corporate: (r, o, p) => `【关于赋能不足导致严重事故的底层闭环复盘反思报告】
致协同业务Owner【${r}】：

针对今日发生的【${o}】重大事故，我已进行深度认知重构与底层逻辑闭环复盘，现向组织提交深刻检讨：

一、事故定级：P0级认知滑坡与感知偏差。
由于个人在大局观链路协同上的严重脱节，未能形成有效的情感闭环，导致核心关系网出现剧烈波动，直接伤害了【${r}】的核心用户体验。

二、痛点归因与反思：
1. 抓手不准：没有在关键节点形成正向反馈机制；
2. 颗粒度过粗：对【${r}】的情绪痛点缺乏共情与敏锐度；
3. 站位不高：把【${o}】当成常态，缺乏敬畏之心！

三、整改落地抓手与惩罚履约：
即日起立行立改，彻底执行惩处方案：【${p}】！
未来将重构响应链路，做到消息0.1秒级秒回、日常无死角赋能。请【${r}】监督验收！`,

  humble_dog: (r, o, p) => `【卑微小狗在线极度痛哭认错书 🐶】
全世界最最最最亲爱的【${r}】：

对不起对不起对不起！呜呜呜呜！我真的知道错了！
我居然做出了【${o}】这种猪狗不如的事！我现在恨不得给自己两百个大耳刮子！
如果道歉有用的话，还要警察干嘛？所以我不仅道歉，我还把命交给你！

千错万错都是我的错，哪怕你今天喝水呛到了也是我呼吸节奏不对！
你生气是应该的，谁让我这么蠢笨如猪！
我的自罚措施已经准备好了：【${p}】，并且我保证：
1. 你往东我绝不往西，你打狗我绝不抓鸡；
2. 每天吹彩虹屁300字以上，把你宠成银河系最高统治者；
3. 你的话就是圣旨，有错那肯定是我理解不够深！

求求你别不理我好不好嘛，小狗没有你真的快要碎掉了……汪汪汪！🥺`,

  wuxia: (r, o, p) => `【江湖罪愆文牒 · 负荆谢罪帖 ⚔️】
在下有眼无珠，特拜上【${r}】阁下法座：

今日武林风起云涌，在下却一时糊涂，竟做出【${o}】此等不齿之举，致使阁下神伤心碎，实乃正道所不容！江湖同道若知，定唾面三尺，耻与为伍！

男儿膝下有黄金，但在下甘愿折节！现已赤身背负荆棘，长跪于山门之下。
自请家法伺候：【${p}】！若皱半下眉头，便不是江湖好汉！
恳请【${r}】大侠念及昔日并肩作战、杯酒言欢之情谊，收回雷霆之怒，在下必当以身相报，护卫左右，万死不辞！

长揖到底，再拜谢罪！`,

  gamer: (r, o, p) => `【电竞终极滑跪求饶信 🎮】
尊贵的野王/大爹/【${r}】：

义父！我错了！我真的大错特错！
今天这把【${o}】，纯纯是我菜如人机、大脑萎缩、小脑打结！我承认我就是那个最下饭的卧底，连累我义父掉分掉段掉心情，我罪该万死！

我宣布：
1. 今日起我自封为全队第一纯牛马，自愿领罚：【${p}】！
2. 下把游戏我无脑锁辅助，出门带宝石，连体婴全程给你当挂件，用肉身挡一切致命大招！
3. 谁再敢惹我义父生气，我顺着网线过去给他两拳！

义父，求求你把我从黑名单拉出来吧，没有你带飞，我这个峡谷孤儿连野怪都打不过啊！爹！`
};

app.post("/api/generate-apology", async (req: Request, res: Response) => {
  try {
    const { recipient = "老婆大人", offense = "忘记回复微信", style = "imperial", penalty = "跪机械键盘两小时" } = req.body;

    const ai = getGeminiClient();

    if (ai) {
      try {
        const stylePrompts: Record<string, string> = {
          imperial: "中国古风宫廷甄嬛体/清宫戏太监格格/罪己诏风格，自称'臣妾/罪奴'，称对方为'老佛爷/皇上/娘娘'，用词极度夸张戏剧化，引经据典，充满清宫剧名场面梗。",
          corporate: "当代中国互联网大厂黑话复盘体，疯狂堆砌高频黑话（赋能、闭环、底层逻辑、抓手、颗粒度、链路、打通、对齐、打法），一本正经胡说八道地复盘自己的犯错行为。",
          humble_dog: "网络极度卑微小狗/舔狗系认错体，语调极其委屈卑微，充满网络流行语、撒娇发疯文学、自扇耳光、'呼吸都是错的'、'小狗要碎掉了'等现代沙雕梗。",
          wuxia: "武侠修仙江湖风格，自称'在下/后学末进'，称对方为'大侠/盟主/尊者'，负荆请罪，自废武功，江湖义气，侠骨柔情却又极度滑稽。",
          gamer: "电竞游戏开黑滑跪体，一口一个'义父/大爹/野王'，痛心疾首反思自己'坑队友/下饭/白给'，承诺下把选辅助当牛马肉身挡伤害。",
          classical: "半文言讽刺自嘲辞赋体，模仿《过秦论》《陈情表》，读起来朗朗上口，古今杂糅，充满冷幽默。"
        };

        const chosenStylePrompt = stylePrompts[style] || stylePrompts.imperial;

        const prompt = `你是一位精通中国当代互联网文化、沙雕幽默、流行梗与古代戏谑文学的文案大师。
请写一篇极度搞笑、诚恳又充满戏剧效果的【中文幽默认错检讨书】。

要求：
1. 致歉对象: ${recipient}
2. 犯下的过错: ${offense}
3. 认罚方式: ${penalty}
4. 语言风格: ${chosenStylePrompt}
5. 融入当代中国互联网流行的经典道歉梗（如：跪搓衣板、跪键盘不能打出字、跪方便面不能碎、多喝热水、疯狂星期四、滑跪、义父等恰当幽默元素）。
6. 排版要极其精美，有明确的标题、自省正文、夸张自罚誓言、盖章落款。长度在300~500字之间，幽默感拉满，让人读了忍不住噗嗤一笑原谅对方！`;

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const aiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const raceResult = await Promise.race([aiPromise, timeoutPromise]);
        if (raceResult && typeof raceResult === 'object' && 'text' in raceResult) {
          const generatedText = raceResult.text;
          if (generatedText && generatedText.trim().length > 30) {
            return res.json({
              success: true,
              apology: generatedText.trim(),
              source: "ai",
            });
          }
        }
      } catch (genError) {
        console.warn("Gemini generation failed, falling back to curated template:", genError);
      }
    }

    // Curated high quality procedural fallback
    const fallbackFn = FALLBACK_TEMPLATES[style] || FALLBACK_TEMPLATES.imperial;
    const fallbackApology = fallbackFn(recipient, offense, penalty);

    return res.json({
      success: true,
      apology: fallbackApology,
      source: "curated",
    });
  } catch (error) {
    console.error("Error in /api/generate-apology:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate apology. Please try again.",
    });
  }
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
