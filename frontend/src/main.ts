import { NzButtonModule } from "ng-zorro-antd/button";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzTableModule } from "ng-zorro-antd/table";
import {
  Component,
  signal,
  computed,
  inject,
  provideZonelessChangeDetection,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";
interface Entity {
  id: string;
  createdAt: string;
}
class Api {
  private http = inject(HttpClient);
  async get<T>(path: string): Promise<T> {
    return (await firstValueFrom(this.http.get<{ data: T }>("/api/" + path)))
      .data;
  }
  async send<T>(method: string, path: string, body: unknown = {}): Promise<T> {
    return (
      await firstValueFrom(
        this.http.request<{ data: T }>(method, "/api/" + path, { body }),
      )
    ).data;
  }
}
interface Plan extends Entity {
  title: string;
  clientName: string;
  clientEmail: string;
  totalCents: number;
}
interface Installment extends Entity {
  planId: string;
  number: number;
  amountCents: number;
  paidCents: number;
  dueDate: string;
}
interface Payment extends Entity {
  installmentId: string;
  amountCents: number;
  note: string;
  idempotencyKey: string;
}
interface PlanDetail {
  plan: Plan;
  installments: { installment: Installment; payments: Payment[] }[];
}
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzTableModule,
  ],
  templateUrl: "./app.html",
  host: { "(document:keydown.escape)": "close()" },
})
class AppComponent {
  error = signal("");
  notice = signal("");
  busy = signal(false);
  panel = signal("");
  query = signal("");
  api = new Api();
  async run(fn: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    try {
      await fn();
    } catch (e) {
      this.error.set(
        e instanceof HttpErrorResponse
          ? e.error?.error ||
              "Sunucuya ulaşılamadı. API bağlantısını kontrol edin."
          : e instanceof Error
            ? e.message
            : "İşlem tamamlanamadı.",
      );
    } finally {
      this.busy.set(false);
    }
  }
  close() {
    this.panel.set("");
  }
  money(c: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(c / 100);
  }
  date(d: string) {
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  time(d: string) {
    return new Date(d).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  plans = signal<Plan[]>([]);
  detail = signal<PlanDetail | null>(null);
  history = signal("");
  payId = "";
  payAmount = "";
  payNote = "";
  paymentKey = "";
  form = {
    title: "",
    clientName: "",
    clientEmail: "",
    total: "",
    count: 3,
    firstDueDate: new Date().toISOString().slice(0, 10),
  };
  visible = computed(() =>
    this.plans().filter((p) =>
      (p.title + " " + p.clientName)
        .toLocaleLowerCase("tr")
        .includes(this.query().toLocaleLowerCase("tr")),
    ),
  );
  paid = computed(
    () =>
      this.detail()?.installments.reduce(
        (s, x) => s + x.installment.paidCents,
        0,
      ) || 0,
  );
  total = computed(() => this.plans().reduce((s, p) => s + p.totalCents, 0));
  constructor() {
    void this.run(() => this.load());
  }
  async load(id?: string) {
    this.plans.set(await this.api.get<Plan[]>("plans"));
    const active = id || this.detail()?.plan.id || this.plans()[0]?.id;
    if (active)
      this.detail.set(await this.api.get<PlanDetail>("plans/" + active));
  }
  select(id: string) {
    this.payId = "";
    void this.run(() => this.load(id));
  }
  cents(value: string) {
    const s = value.trim().replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(s))
      throw new Error("Tutar en fazla iki ondalık basamak içermeli.");
    const [a, b = ""] = s.split(".");
    return Number(a) * 100 + Number(b.padEnd(2, "0"));
  }
  save() {
    void this.run(async () => {
      const p = await this.api.send<Plan>("POST", "plans", {
        ...this.form,
        totalCents: this.cents(this.form.total),
      });
      await this.load(p.id);
      this.close();
      this.form = {
        ...this.form,
        title: "",
        clientName: "",
        clientEmail: "",
        total: "",
      };
    });
  }
  startPay(i: Installment) {
    this.payId = i.id;
    this.payAmount = ((i.amountCents - i.paidCents) / 100).toFixed(2);
    this.payNote = "";
    this.paymentKey = crypto.randomUUID();
  }
  pay() {
    void this.run(async () => {
      await this.api.send("POST", "installments/" + this.payId + "/payments", {
        amountCents: this.cents(this.payAmount),
        note: this.payNote,
        idempotencyKey: this.paymentKey,
      });
      this.payId = "";
      await this.load();
      this.notice.set("Tahsilat kaydedildi.");
    });
  }
  late(i: Installment) {
    return (
      i.paidCents < i.amountCents &&
      i.dueDate < new Date().toLocaleDateString("sv-SE")
    );
  }
}
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideZonelessChangeDetection()],
}).catch(console.error);
